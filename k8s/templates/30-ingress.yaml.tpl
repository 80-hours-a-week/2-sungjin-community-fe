apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: community-frontend
  namespace: ${NAMESPACE}
spec:
  ingressClassName: "${INGRESS_CLASS_NAME}"
  rules:
    - http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: community-frontend
                port:
                  number: 80
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: community-backend-api
  namespace: ${NAMESPACE}
  annotations:
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  ingressClassName: "${INGRESS_CLASS_NAME}"
  rules:
    - http:
        paths:
          - path: /api(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: community-backend
                port:
                  number: 8000
