import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import * as elb from '@aws-cdk/aws-elasticloadbalancingv2';

const cidr = '10.0.0.0/16';
export class CdkThreeTierStack extends cdk.Stack {

  public readonly vpc: ec2.Vpc;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;
  public readonly ec2SecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly rdsCluster: rds.DatabaseCluster;
  public readonly loadBalancer: elb.CfnLoadBalancer;

  private readonly dbPort: number = 3306;
  private readonly httpPort: number = 80;
  private readonly httpsPort: number = 443;
  private readonly defaultLoadBalancerScheme = 'internet-facing'

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

    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc: this.vpc,
      allowAllOutbound: false
    });

    this.vpc.privateSubnets.forEach((subnet) => {
      this.rdsSecurityGroup.addIngressRule(ec2.Peer.ipv4(subnet.ipv4CidrBlock), ec2.Port.tcp(this.dbPort), `${subnet.ipv4CidrBlock}:${this.dbPort}`)
      this.rdsSecurityGroup.addEgressRule(ec2.Peer.ipv4(subnet.ipv4CidrBlock), ec2.Port.allTcp(), `from ${subnet.ipv4CidrBlock}:ALL PORTS`)

    });

    this.ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: this.vpc,
      allowAllOutbound: false
    });

    this.vpc.publicSubnets.forEach((subnet) => {
      // http in
      this.ec2SecurityGroup.addIngressRule(ec2.Peer.ipv4(subnet.ipv4CidrBlock), ec2.Port.tcp(this.httpPort), `${subnet.ipv4CidrBlock}:${this.httpPort}`);
      
      // DB out
      this.ec2SecurityGroup.addEgressRule(ec2.Peer.ipv4(subnet.ipv4CidrBlock), ec2.Port.tcp(this.dbPort), `from ${subnet.ipv4CidrBlock}:${this.dbPort}`)
    })
    // https out
    this.ec2SecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(this.httpsPort), `from 0.0.0.0/0:${this.httpsPort}`)

    this.albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: this.vpc,
      allowAllOutbound: false
    });

    
    // e subnet 80
    this.vpc.privateSubnets.forEach((subnet) => {
      this.albSecurityGroup.addEgressRule(ec2.Peer.ipv4(subnet.ipv4CidrBlock), ec2.Port.tcp(this.httpPort), `${subnet.ipv4CidrBlock}:${this.httpPort}`);
    });
    
    // e 443
    this.albSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(this.httpsPort),`to 0.0.0.0/0:${this.httpsPort}`);
    
    
    // in 443
    this.albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(this.httpPort), `from 0.0.0.0/0:${this.httpPort}`);
    
    // in 80
    this.albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(this.httpsPort), `from 0.0.0.0/0:${this.httpsPort}`);
    
    this.rdsCluster = new rds.DatabaseCluster(this, 'MyRDSCluster', {
      defaultDatabaseName: 'MyRDSDb',
      engine: rds.DatabaseClusterEngine.AURORA,
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
        securityGroups: [
          this.rdsSecurityGroup
        ]
      },

    });

    new elb.CfnLoadBalancer(this, 'LoadBalancer', {
      scheme: this.defaultLoadBalancerScheme,
      subnets: this.vpc.selectSubnets({subnetType: ec2.SubnetType.PUBLIC}).subnetIds,
      securityGroups: [this.albSecurityGroup.securityGroupId]
    });

  }
}
