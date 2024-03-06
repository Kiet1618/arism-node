import JsonStringify from 'json-stable-stringify';
import { BN, EC } from '@common';

export const thresholdSame = <T>(arr: T[], t: number): T | null => {
  const hashMap: Record<string, number> = {};

  for (let i = 0; i < arr.length; i += 1) {
    const str = JsonStringify(arr[i]);
    hashMap[str] = hashMap[str] ? hashMap[str] + 1 : 1;

    if (hashMap[str] === t) {
      return arr[i];
    }
  }

  return null;
};

export const kCombinations = (s: number | number[], k: number): number[][] => {
  let set = s;

  if (typeof set === 'number') {
    set = Array.from({ length: set }, (_, i) => i);
  }

  if (k > set.length || k <= 0) {
    return [];
  }

  if (k === set.length) {
    return [set];
  }

  if (k === 1) {
    return set.reduce((acc, cur) => [...acc, [cur]], [] as number[][]);
  }

  const combs: number[][] = [];
  let tailCombs: number[][] = [];

  for (let i = 0; i <= set.length - k + 1; i += 1) {
    tailCombs = kCombinations(set.slice(i + 1), k - 1);
    for (let j = 0; j < tailCombs.length; j += 1) {
      combs.push([set[i], ...tailCombs[j]]);
    }
  }
  return combs;
};

export const lagrangeInterpolation = (
  indices: BN[],
  values: BN[],
  xPoint: BN,
): BN | null => {
  if (values.length !== indices.length) {
    return null;
  }

  let secret = BN.ZERO;
  for (let i = 0; i < values.length; i += 1) {
    const iBN = indices[i];

    let upper = BN.ONE;
    let lower = BN.ONE;

    for (let j = 0; j < values.length; j += 1) {
      if (i !== j) {
        const jBN = indices[j];

        upper = upper.mul(xPoint.sub(jBN));
        upper = upper.umod(EC.ORDER);

        let temp = iBN.sub(jBN);
        temp = temp.umod(EC.ORDER);
        lower = lower.mul(temp).umod(EC.ORDER);
      }
    }

    let delta = upper.mul(lower.invm(EC.ORDER)).umod(EC.ORDER);
    delta = delta.mul(values[i]).umod(EC.ORDER);
    secret = secret.add(delta);
  }

  return secret.umod(EC.ORDER);
};
