import { expect as expectCDK, matchTemplate, MatchStyle, haveResource, countResources } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CdkThreeTier from '../lib/cdk-three-tier-stack';

const stack = new cdk.Stack();
const myStack = new CdkThreeTier.CdkThreeTierStack(stack, 'MyTestStack');

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