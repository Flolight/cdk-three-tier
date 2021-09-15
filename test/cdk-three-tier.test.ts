import { expect as expectCDK, matchTemplate, MatchStyle, haveResource, haveResourceLike, countResources } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CdkThreeTier from '../lib/cdk-three-tier-stack';

const stack = new cdk.Stack();
const myStack = new CdkThreeTier.CdkThreeTierStack(stack, 'MyTestStack');
const privateDB_CIDR1 = "10.0.64.0/19";
const privateDB_CIDR2 = "10.0.96.0/19";
const publicEC2_CIDR1 = "10.0.0.0/19";
const publicEC2_CIDR2 = "10.0.32.0/19";
const dbPort = 3306;
const httpPort = 80;
const httpsPort = 443;

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
      {"CidrIp":`${privateDB_CIDR1}`,"Description":`from ${privateDB_CIDR1}:ALL PORTS`,"FromPort":0,"IpProtocol":"tcp","ToPort":65535},
      {"CidrIp":`${privateDB_CIDR2}`,"Description":`from ${privateDB_CIDR2}:ALL PORTS`,"FromPort":0,"IpProtocol":"tcp","ToPort":65535}
  ],
    SecurityGroupIngress: [
      { "CidrIp": privateDB_CIDR1, "Description": `${privateDB_CIDR1}:${dbPort}`, "FromPort": dbPort, "IpProtocol": "tcp", "ToPort": dbPort },
      { "CidrIp": privateDB_CIDR2, "Description": `${privateDB_CIDR2}:${dbPort}`, "FromPort": dbPort, "IpProtocol": "tcp", "ToPort": dbPort },
    ],
    VpcId: {"Ref": "AppVPCB7733741"}
  }));
});

test('VPC has a security group for EC2', () => {
  expectCDK(myStack).to(haveResourceLike('AWS::EC2::SecurityGroup',{
    SecurityGroupEgress: [
      // For EC2 to contact DB
      {"CidrIp":`${publicEC2_CIDR1}`,"Description":`from ${publicEC2_CIDR1}:${dbPort}`, "FromPort":dbPort,"IpProtocol":"tcp","ToPort":dbPort},
      {"CidrIp":`${publicEC2_CIDR2}`,"Description":`from ${publicEC2_CIDR2}:${dbPort}`,"FromPort":dbPort,"IpProtocol":"tcp","ToPort":dbPort},
      
      // For EC2 to contact the internet
      {"CidrIp":`0.0.0.0/0`,"Description":`from 0.0.0.0/0:${httpsPort}`,"FromPort":httpsPort,"IpProtocol":"tcp","ToPort":httpsPort}
  ],
    SecurityGroupIngress: [
      // For LoadB to contact EC2
      { "CidrIp": publicEC2_CIDR1, "Description": `${publicEC2_CIDR1}:${httpPort}`, "FromPort": httpPort, "IpProtocol": "tcp", "ToPort": httpPort },
      { "CidrIp": publicEC2_CIDR2, "Description": `${publicEC2_CIDR2}:${httpPort}`, "FromPort": httpPort, "IpProtocol": "tcp", "ToPort": httpPort },
    ],
    VpcId: {"Ref": "AppVPCB7733741"}
  }));
});

test('VPC has an RDS instance', () => {

  expectCDK(myStack).to(haveResource('AWS::RDS::DBCluster'));

});

