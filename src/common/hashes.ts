import createKeccakHash from 'keccak'

export function keccak256(a: string | Buffer): string {
  const hash = createKeccakHash('keccak256').update(a).digest().toString('hex')
  return `0x${hash}`
}
