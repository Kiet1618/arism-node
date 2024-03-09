import { BN } from '@common'

export type Point = { x: BN; y: BN }
export type StringPoint = { x: string; y: string }
export type Node = { id: number; url: string; publicKey: StringPoint }
