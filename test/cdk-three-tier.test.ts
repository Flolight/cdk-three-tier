import { expect as expectCDK, matchTemplate, MatchStyle, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CdkThreeTier from '../lib/cdk-three-tier-stack';

const stack = new cdk.Stack();

test('Not Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CdkThreeTier.CdkThreeTierStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).notTo(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});

test('VPC is created', () => {
  const myStack = new CdkThreeTier.CdkThreeTierStack(stack, 'MyTestStack');
  expectCDK(myStack).to(haveResource('AWS::EC2::VPC'));
});