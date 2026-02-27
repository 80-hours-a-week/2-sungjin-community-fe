pipeline {
  agent any

  options {
    disableConcurrentBuilds()
  }

  parameters {
    string(name: 'DOCKERHUB_USER', defaultValue: 'sungjin9288', description: 'Docker Hub username')
    string(name: 'IMAGE_TAG', defaultValue: 'jenkins-${BUILD_NUMBER}', description: 'Docker image tag')
    booleanParam(name: 'PUSH_IMAGE', defaultValue: false, description: 'Push image to Docker Hub')
  }

  environment {
    FE_IMAGE = "${params.DOCKERHUB_USER}/community-frontend:${params.IMAGE_TAG}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Unit Test') {
      steps {
        sh 'npm test'
      }
    }

    stage('Build Docker Image') {
      steps {
        sh 'docker build -t "$FE_IMAGE" .'
      }
    }

    stage('Push Docker Image') {
      when {
        expression { return params.PUSH_IMAGE }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PAT')]) {
          sh '''
            set -euo pipefail
            echo "$DOCKERHUB_PAT" | docker login -u "$DOCKERHUB_USER" --password-stdin
            docker push "$FE_IMAGE"
          '''
        }
      }
    }
  }
}
