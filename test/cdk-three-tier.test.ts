import { expect as expectCDK, matchTemplate, MatchStyle, haveResource, haveResourceLike, countResources } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CdkThreeTier from '../lib/cdk-three-tier-stack';

const stack = new cdk.Stack();
const myStack = new CdkThreeTier.CdkThreeTierStack(stack, 'MyTestStack');
const privateCIDR1 = "10.0.64.0/19";
const privateCIDR2 = "10.0.96.0/19";
const dbPort = 3306;

test('Not Empty Stack', () => {
    // THEN
    expectCDK(myStack).notTo(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});

test('VPC is created', () => {
  
  // THEN
  expectCDK(myStack).to(haveResource('AWS::EC2::VPC'));
});

test('VPC has the right number of resources' ,() => {

  // THEN
  expectCDK(myStack).to(countResources('AWS::EC2::Subnet', 6));
  expectCDK(myStack).to(countResources('AWS::EC2::NatGateway', 2));
  expectCDK(myStack).to(countResources('AWS::EC2::RouteTable', 6));
  expectCDK(myStack).to(countResources('AWS::EC2::InternetGateway', 1));
});

test('VPC has a security group for Database', () => {
  expectCDK(myStack).to(haveResourceLike('AWS::EC2::SecurityGroup',{
    SecurityGroupEgress: [
      {"CidrIp":`${privateCIDR1}`,"Description":`from ${privateCIDR1}:ALL PORTS`,"FromPort":0,"IpProtocol":"tcp","ToPort":65535},
      {"CidrIp":`${privateCIDR2}`,"Description":`from ${privateCIDR2}:ALL PORTS`,"FromPort":0,"IpProtocol":"tcp","ToPort":65535}
  ],
    SecurityGroupIngress: [
      { "CidrIp": privateCIDR1, "Description": `${privateCIDR1}:${dbPort}`, "FromPort": dbPort, "IpProtocol": "tcp", "ToPort": dbPort },
      { "CidrIp": privateCIDR2, "Description": `${privateCIDR2}:${dbPort}`, "FromPort": dbPort, "IpProtocol": "tcp", "ToPort": dbPort },
    ],
    VpcId: {"Ref": "AppVPCB7733741"}
  }));
});

test('VPC has an RDS instance', () => {

  expectCDK(myStack).to(haveResource('AWS::RDS::DBCluster'));

});