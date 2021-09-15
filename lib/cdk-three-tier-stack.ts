import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export class CdkThreeTierStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Defining a VPC for the application
    const vpc = new ec2.Vpc(this, 'AppVPC', {
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          name: 'LoadBalancer',
          subnetType: ec2.SubnetType.PUBLIC
        },
        {
          name: 'App',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
        },
        {
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      ]

    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc: vpc,
      allowAllOutbound: false
    });
    vpc.privateSubnets.forEach((subnet) => {
      rdsSecurityGroup.addIngressRule(ec2.Peer.ipv4(subnet.ipv4CidrBlock), ec2.Port.tcp(3306), `${subnet.ipv4CidrBlock}:3306`)
      rdsSecurityGroup.addEgressRule(ec2.Peer.ipv4(subnet.ipv4CidrBlock), ec2.Port.allTcp(), `from ${subnet.ipv4CidrBlock}:ALL PORTS`)

    });

  }
}
