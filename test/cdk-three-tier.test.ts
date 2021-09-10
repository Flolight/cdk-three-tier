import { expect as expectCDK, matchTemplate, MatchStyle, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as CdkThreeTier from '../lib/cdk-three-tier-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new CdkThreeTier.CdkThreeTierStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});

test('VPC is created', () => {
  const stack = new cdk.Stack();

  expectCDK(stack).to(haveResource('AWS::EC2::VPC'));
});