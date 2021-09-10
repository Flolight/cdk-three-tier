import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export class CdkThreeTierStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Defining a VPC for the application
    const vpc = new ec2.Vpc(this, 'AppVPC', {
      cidr: '10.0.0.0/16'

    });

  }
}
