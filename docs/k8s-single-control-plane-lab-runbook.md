# Kubernetes Single-Control-Plane Lab Runbook

## 목적 | Goal
이 문서는 다음 과제를 **재현 가능한 실습 절차**로 정리한 runbook입니다.

- Rocky Linux 기반 single control-plane Kubernetes 구축
- containerd + Calico 조합 사용
- Kubernetes Dashboard / Prometheus / Grafana / Loki 설치
- FE/BE 배포 시 `startupProbe`, `livenessProbe`, `readinessProbe` 통과 확인
- 파드 강제 삭제 후 재생성 확인
- `RollingUpdate` 무중단 배포 검증
- Ubuntu 22.04 LTS로 동일 절차 재수행
- 기존 수동 설치분을 제거한 뒤 Helm 기반으로 clean reinstall

중요:
- 이 저장소는 **실습 재현용 자산과 runbook**을 제공합니다.
- 실제 클러스터 구축/삭제는 Rocky Linux 또는 Ubuntu 호스트에서 직접 수행해야 합니다.

## 공식 참고 문서 | Official References
- Kubernetes kubeadm install:
  - https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/
- Kubernetes containerd runtime:
  - https://kubernetes.io/docs/setup/production-environment/container-runtimes/
- Kubernetes kubeadm cluster creation:
  - https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/
- Calico quickstart:
  - https://docs.tigera.io/calico/latest/getting-started/kubernetes/quickstart
- Helm install:
  - https://helm.sh/docs/intro/install/
- Kubernetes Dashboard Helm install:
  - https://github.com/kubernetes/dashboard
- kube-prometheus-stack chart:
  - https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack
- Loki monolithic Helm install:
  - https://grafana.com/docs/loki/latest/setup/install/helm/install-monolithic/
- Promtail Helm install:
  - https://grafana.com/docs/loki/latest/send-data/promtail/installation/

## 저장소 내 관련 자산 | Repo Assets
- App manifests:
  - `k8s/templates/10-backend.yaml.tpl`
  - `k8s/templates/20-frontend.yaml.tpl`
  - `k8s/templates/30-ingress.yaml.tpl`
- Helm values:
  - `helm/kube-prometheus-stack/values.lab.yaml`
  - `helm/loki/values.lab.yaml`
  - `helm/promtail/values.lab.yaml`

---

## 1. Rocky Linux single control-plane 구축

### 1-1. 호스트 준비
Rocky Linux / CentOS 계열에서는 Kubernetes 공식 문서 기준으로 SELinux를 `permissive`로 두는 실습 구성이 가장 단순합니다.

```bash
sudo setenforce 0
sudo sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config

sudo swapoff -a
sudo sed -ri '/\sswap\s/s/^#?/#/' /etc/fstab

cat <<'EOF' | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

cat <<'EOF' | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
EOF

sudo sysctl --system
```

### 1-2. containerd 설치 및 설정
Kubernetes 공식 문서 기준으로 `containerd`는 CRI가 활성화되어 있어야 하고, `SystemdCgroup = true`가 권장됩니다.

```bash
sudo dnf install -y containerd
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml > /dev/null
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sudo systemctl enable --now containerd
sudo systemctl restart containerd
```

### 1-3. kubeadm / kubelet / kubectl 설치
Kubernetes 1.35 기준 예시입니다. minor version을 바꾸려면 repo URL의 `v1.35` 부분을 맞춰야 합니다.

```bash
cat <<'EOF' | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://pkgs.k8s.io/core:/stable:/v1.35/rpm/
enabled=1
gpgcheck=1
gpgkey=https://pkgs.k8s.io/core:/stable:/v1.35/rpm/repodata/repomd.xml.key
exclude=kubelet kubeadm kubectl cri-tools kubernetes-cni
EOF

sudo yum install -y kubelet kubeadm kubectl --disableexcludes=kubernetes
sudo systemctl enable --now kubelet
```

### 1-4. control-plane 초기화
Calico 예시 CIDR과 맞추기 위해 `192.168.0.0/16`을 사용합니다.

```bash
sudo kubeadm init --pod-network-cidr=192.168.0.0/16
```

초기화 후:

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown "$(id -u)":"$(id -g)" $HOME/.kube/config
```

### 1-5. master-only 실습을 위한 taint 제거
Kubernetes 공식 문서 기준으로 single-machine cluster에서 워크로드를 control-plane에 올리려면 taint 제거가 필요합니다.

```bash
kubectl taint nodes --all node-role.kubernetes.io/control-plane-
kubectl label nodes --all node.kubernetes.io/exclude-from-external-load-balancers-
```

### 1-6. Calico 설치
운영 환경에선 Calico operator 설치 방식이 일반적입니다.

```bash
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.31.3/manifests/tigera-operator.yaml
curl -fsSL -o /tmp/calico-custom-resources.yaml https://raw.githubusercontent.com/projectcalico/calico/v3.31.3/manifests/custom-resources.yaml
sed -i 's#cidr: 192.168.0.0/16#cidr: 192.168.0.0/16#' /tmp/calico-custom-resources.yaml
kubectl create -f /tmp/calico-custom-resources.yaml
```

확인:

```bash
kubectl get nodes
kubectl get pods -n calico-system
```

---

## 2. Helm 설치

### Rocky Linux
Helm 공식 문서 기준으로 Fedora/RHEL 계열은 `dnf install helm` 경로가 있습니다.

```bash
sudo dnf install -y helm
helm version
```

### Ubuntu 22.04
Helm 공식 문서 예시:

```bash
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-4
chmod 700 get_helm.sh
./get_helm.sh
helm version
```

---

## 3. Dashboard / Prometheus / Grafana / Loki 설치

### 3-1. Helm repo 등록
```bash
helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

### 3-2. Kubernetes Dashboard 설치
Dashboard 프로젝트는 현재 Helm 설치만 지원합니다.

```bash
helm upgrade --install kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard \
  --namespace kubernetes-dashboard \
  --create-namespace
```

접속은 실습용으로 port-forward가 가장 단순합니다.

```bash
kubectl -n kubernetes-dashboard port-forward svc/kubernetes-dashboard-kong-proxy 8443:443
```

### 3-3. Dashboard admin 계정
```bash
kubectl create namespace dashboard-admin

cat <<'EOF' | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: dashboard-admin
  namespace: dashboard-admin
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: dashboard-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: dashboard-admin
    namespace: dashboard-admin
EOF

kubectl -n dashboard-admin create token dashboard-admin
```

### 3-4. kube-prometheus-stack 설치
Grafana와 Prometheus는 `kube-prometheus-stack`으로 같이 설치합니다.

```bash
helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  -f helm/kube-prometheus-stack/values.lab.yaml
```

### 3-5. Loki 설치
Loki는 과제용 single-node lab에 맞춰 monolithic single-binary 구성으로 둡니다.

```bash
helm upgrade --install loki grafana/loki \
  --namespace loki \
  --create-namespace \
  -f helm/loki/values.lab.yaml
```

### 3-6. Promtail 설치
Promtail은 공식 문서 기준 DaemonSet 배포가 권장됩니다.

```bash
helm upgrade --install promtail grafana/promtail \
  --namespace loki \
  -f helm/promtail/values.lab.yaml
```

### 3-7. Grafana에 Prometheus / Loki datasource 연결 확인
`kube-prometheus-stack`은 Grafana와 Prometheus를 같이 띄웁니다. 이 저장소의 values는 Grafana에 Loki datasource를 추가합니다.

Grafana 접속:

```bash
kubectl -n monitoring port-forward svc/kube-prometheus-stack-grafana 3000:80
```

Prometheus 접속:

```bash
kubectl -n monitoring port-forward svc/kube-prometheus-stack-prometheus 9090:9090
```

확인 포인트:
- Grafana -> Connections -> Data sources
- `Prometheus` 존재
- `Loki` 존재

---

## 4. FE / BE를 Kubernetes에 배포

### 4-1. 이미지 준비
과제용 새 버전 이미지를 만들려면 Docker Hub 태그를 먼저 준비합니다.

```bash
docker build -t <dockerhub-user>/community-frontend:<tag> .
docker build -t <dockerhub-user>/community-backend:<tag> ../2-sungjin-community-be
docker push <dockerhub-user>/community-frontend:<tag>
docker push <dockerhub-user>/community-backend:<tag>
```

### 4-2. 매니페스트 렌더링 및 적용
현재 템플릿은 다음 조건을 반영합니다.

- `startupProbe`
- `readinessProbe`
- `livenessProbe`
- `RollingUpdate`
- FE / BE 기본 replicas 2

주의:
- 현재 템플릿의 기본 예시는 `DATABASE_URL=<real-db-url>`입니다.
- backend를 `sqlite:///./data/community.db`로 띄우면 single-pod lab은 가능하지만, replica를 2 이상으로 늘렸을 때 각 파드가 서로 다른 로컬 DB를 사용하게 됩니다.
- 과제 4, 5를 backend까지 엄밀하게 검증하려면 shared MySQL/PostgreSQL 같은 공용 DB를 먼저 연결하는 편이 맞습니다.
- 공용 DB 없이 실습 흐름만 재현할 경우에는 FE/BE를 모두 배포하되, pod deletion / rolling update demonstration은 `community-frontend` Deployment 기준으로 수행하는 방식을 권장합니다.

예시:

```bash
export NAMESPACE=community
export DOCKERHUB_USER=<dockerhub-user>
export IMAGE_TAG=<tag>
export API_URL=/api
export FILE_UPLOAD_API_URL=
export DATABASE_URL=<real-db-url>
export CORS_ALLOW_ORIGINS=http://<your-ingress-host>
export INGRESS_CLASS_NAME=nginx
export BACKEND_REPLICAS=2
export FRONTEND_REPLICAS=2

mkdir -p k8s/rendered
for template in k8s/templates/*.yaml.tpl; do
  envsubst < "$template" > "k8s/rendered/$(basename "${template%.tpl}")"
done

kubectl apply -f k8s/rendered
kubectl rollout status deployment/community-backend -n "$NAMESPACE"
kubectl rollout status deployment/community-frontend -n "$NAMESPACE"
```

### 4-3. Probe 확인
```bash
kubectl describe deploy community-backend -n "$NAMESPACE"
kubectl describe deploy community-frontend -n "$NAMESPACE"
kubectl get pods -n "$NAMESPACE"
```

확인 포인트:
- `StartupProbe` 통과 후 `Running`
- `ReadinessProbe`가 `True`
- `LivenessProbe` 실패 없이 안정 유지

---

## 5. 파드 삭제 후 self-healing 확인

```bash
kubectl get pods -n "$NAMESPACE"
kubectl delete pod <frontend-or-backend-pod-name> -n "$NAMESPACE"
kubectl get pods -n "$NAMESPACE" -w
```

확인 포인트:
- Dashboard에서 새 pod가 생성되는지
- Grafana에서 restart / replica / pod count 변화를 확인할 수 있는지

추천 Grafana 관찰 대상:
- Kubernetes / Compute Resources / Namespace (Pods)
- Kubernetes / Compute Resources / Pod

---

## 6. RollingUpdate 무중단 배포 테스트

새 이미지 태그 배포:

```bash
kubectl set image deployment/community-frontend \
  community-frontend=<dockerhub-user>/community-frontend:<new-tag> \
  -n "$NAMESPACE"

kubectl rollout status deployment/community-frontend -n "$NAMESPACE"
kubectl get rs -n "$NAMESPACE"
kubectl get pods -n "$NAMESPACE" -w
```

백엔드도 동일:

```bash
kubectl set image deployment/community-backend \
  community-backend=<dockerhub-user>/community-backend:<new-tag> \
  -n "$NAMESPACE"
kubectl rollout status deployment/community-backend -n "$NAMESPACE"
```

이 저장소의 Deployment 템플릿은 다음 전략을 사용합니다.

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 0
    maxSurge: 1
```

즉 readiness 통과 전에는 기존 pod를 다 내리지 않도록 구성되어 있습니다.

---

## 7. Ubuntu 22.04 LTS로 재구축

차이점은 주로 package install 부분입니다.

### Ubuntu 22.04 kubeadm / kubelet / kubectl
```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg
sudo mkdir -p -m 755 /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.35/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.35/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
sudo systemctl enable --now kubelet
```

나머지 흐름은 Rocky와 동일합니다.
- swap off
- kernel module / sysctl
- containerd
- kubeadm init
- control-plane taint 제거
- Calico 설치
- Helm 설치
- Dashboard / Monitoring / Loki 설치
- 앱 배포 / probe / rollout 검증

---

## 8. 기존 설치 삭제 후 Helm으로 clean reinstall

### 8-1. Helm release 제거
```bash
helm uninstall kubernetes-dashboard -n kubernetes-dashboard
helm uninstall kube-prometheus-stack -n monitoring
helm uninstall loki -n loki
helm uninstall promtail -n loki
```

### 8-2. Namespace 정리
```bash
kubectl delete namespace kubernetes-dashboard monitoring loki dashboard-admin
```

### 8-3. kube-prometheus-stack CRD 정리
공식 chart 문서 기준으로 CRD는 기본적으로 자동 삭제되지 않습니다.

```bash
kubectl delete crd alertmanagerconfigs.monitoring.coreos.com
kubectl delete crd alertmanagers.monitoring.coreos.com
kubectl delete crd podmonitors.monitoring.coreos.com
kubectl delete crd probes.monitoring.coreos.com
kubectl delete crd prometheusagents.monitoring.coreos.com
kubectl delete crd prometheuses.monitoring.coreos.com
kubectl delete crd prometheusrules.monitoring.coreos.com
kubectl delete crd scrapeconfigs.monitoring.coreos.com
kubectl delete crd servicemonitors.monitoring.coreos.com
kubectl delete crd thanosrulers.monitoring.coreos.com
```

### 8-4. 잔여 RBAC / ServiceAccount 확인
```bash
kubectl get clusterrole,clusterrolebinding | egrep 'dashboard|prometheus|grafana|loki|promtail'
kubectl get sa -A | egrep 'dashboard|prometheus|grafana|loki|promtail'
```

잔여물이 있으면 명시적으로 삭제합니다.

### 8-5. Helm으로 재설치
위의 `3번` 절차를 다시 수행합니다.

---

## 제출 체크리스트 | Submission Checklist
- [ ] Rocky Linux + containerd + Calico + kubeadm single control-plane 구축 완료
- [ ] control-plane taint 제거 후 master-only 운영 확인
- [ ] Kubernetes Dashboard 설치 및 로그인 확인
- [ ] kube-prometheus-stack 설치 후 Grafana/Prometheus 접근 확인
- [ ] Loki + Promtail 설치 후 로그 수집 확인
- [ ] Grafana에서 Prometheus / Loki datasource 확인
- [ ] FE/BE Deployment에 startup/readiness/liveness probe 적용 확인
- [ ] replicas 2 이상으로 파드 재생성 확인
- [ ] RollingUpdate로 새 이미지 무중단 배포 확인
- [ ] Ubuntu 22.04에서 재실습
- [ ] 기존 설치 clean delete 후 Helm reinstall 재실습

## 현재 저장소 기준 남는 수동 작업 | What still requires live infrastructure
- Rocky Linux 또는 Ubuntu 서버 실제 준비
- kubeadm init / Calico / Helm install
- Dashboard / Grafana / Prometheus / Loki 실제 설치
- Docker image build & push
- 파드 강제 삭제 / 롤링 업데이트 실습

이 저장소는 그 실습을 위해 필요한 **application manifests, Helm values, execution runbook**을 제공하는 상태까지 맞췄습니다.
