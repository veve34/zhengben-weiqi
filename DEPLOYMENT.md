# 部署到 AWS 需要的 IAM 權限

部署架構：單一 EC2 主機，用 SSM Session Manager 遠端管理（不開 SSH 埠、不用管理金鑰）。

以下分三塊，请依角色建立對應的 IAM Policy。

## 1. 建置時期權限（建立資源的人用，一次性）

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EC2Provisioning",
      "Effect": "Allow",
      "Action": [
        "ec2:RunInstances",
        "ec2:TerminateInstances",
        "ec2:StopInstances",
        "ec2:StartInstances",
        "ec2:DescribeInstances",
        "ec2:DescribeImages",
        "ec2:DescribeInstanceTypes",
        "ec2:CreateTags",
        "ec2:DescribeTags"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SecurityGroup",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:DescribeSecurityGroups"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ElasticIP",
      "Effect": "Allow",
      "Action": [
        "ec2:AllocateAddress",
        "ec2:AssociateAddress",
        "ec2:ReleaseAddress",
        "ec2:DescribeAddresses"
      ],
      "Resource": "*"
    },
    {
      "Sid": "InstanceRoleSetup",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:CreateInstanceProfile",
        "iam:AddRoleToInstanceProfile",
        "iam:AttachRolePolicy"
      ],
      "Resource": "arn:aws:iam::*:role/zhengben-weiqi-ec2-role"
    },
    {
      "Sid": "PassRoleScoped",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::*:role/zhengben-weiqi-ec2-role",
      "Condition": { "StringEquals": { "iam:PassedToService": "ec2.amazonaws.com" } }
    }
  ]
}
```

若网域要用 Route 53 管理，另外加：
```json
{
  "Sid": "OptionalRoute53",
  "Effect": "Allow",
  "Action": ["route53:ChangeResourceRecordSets", "route53:ListHostedZones", "route53:GetHostedZone"],
  "Resource": "*"
}
```
（HTTPS 建議直接在 EC2 上用 Nginx + certbot 处理，不一定需要 ALB/ACM，除非之后要做负载平衡。）

## 2. EC2 執行個體角色（掛在主機上）

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:*:*:log-group:/zhengben-weiqi/*"
    },
    {
      "Sid": "SecretsForEnv",
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:*:*:secret:zhengben-weiqi/*"
    }
  ]
}
```

再加掛 AWS 官方 Managed Policy：**`AmazonSSMManagedInstanceCore`**（用於 Session Manager 远程连线）。

`SecretsForEnv` 為選配，若 `.env` 內容改放 AWS Secrets Manager 才需要；MVP 阶段沿用 `.env` 檔案也可以先跳过这条。

## 3.（選配）CI/CD 自動部署角色

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DeployViaSSM",
      "Effect": "Allow",
      "Action": ["ssm:SendCommand", "ssm:GetCommandInvocation"],
      "Resource": "*"
    },
    {
      "Sid": "ArtifactBucket",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::zhengben-weiqi-deploy-artifacts/*"
    }
  ]
}
```

等确定要做自动化部署（例如 GitHub Actions push 自动上线）再建立这块。

## 安全注意事项

`iam:PassRole` 务必像上面一样把 `Resource` 限定成特定角色 ARN，并加 `iam:PassedToService` 条件，不要给 `"Resource": "*"`——这是最常见的 AWS 权限提升漏洞。
