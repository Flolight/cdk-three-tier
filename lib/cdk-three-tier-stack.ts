import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';

const cidr = '10.0.0.0/16';
export class CdkThreeTierStack extends cdk.Stack {

  public readonly vpc: ec2.Vpc;
  
  private readonly dbPort: number = 3306;


  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Defining a VPC for the application
    this.vpc = new ec2.Vpc(this, 'AppVPC', {
      cidr: cidr,
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
      vpc: this.vpc,
      allowAllOutbound: false
    });

    this.vpc.privateSubnets.forEach((subnet) => {
      rdsSecurityGroup.addIngressRule(ec2.Peer.ipv4(subnet.ipv4CidrBlock), ec2.Port.tcp(this.dbPort), `${subnet.ipv4CidrBlock}:${this.dbPort}`)
      rdsSecurityGroup.addEgressRule(ec2.Peer.ipv4(subnet.ipv4CidrBlock), ec2.Port.allTcp(), `from ${subnet.ipv4CidrBlock}:ALL PORTS`)

    });

    const rdsCluster = new rds.DatabaseCluster(this, 'MyRDSCluster', {
      defaultDatabaseName: 'MyRDSDb',
      engine: rds.DatabaseClusterEngine.AURORA,
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
        securityGroups: [
          rdsSecurityGroup
        ]
      },

    });

  }
}
