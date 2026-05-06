import { sha256 } from 'js-sha256';
import { Block, ParticipationRecord } from '../types';

export class ScholasticBlockchain {
  static readonly DIFFICULTY = 2;
  static readonly GENESIS_TIMESTAMP = 0;
  static readonly GENESIS_PREVIOUS_HASH = '0';

  static calculateHash(
    index: number,
    previousHash: string,
    timestamp: number,
    data: ParticipationRecord[],
    nonce: number
  ): string {
    const payload = [index, previousHash, timestamp, JSON.stringify(data), nonce].join('|');
    return sha256(payload);
  }

  private static mine(
    index: number,
    previousHash: string,
    timestamp: number,
    data: ParticipationRecord[]
  ): { hash: string; nonce: number } {
    const target = '0'.repeat(this.DIFFICULTY);
    let nonce = 0;
    let hash = this.calculateHash(index, previousHash, timestamp, data, nonce);
    while (hash.substring(0, this.DIFFICULTY) !== target) {
      nonce++;
      hash = this.calculateHash(index, previousHash, timestamp, data, nonce);
    }
    return { hash, nonce };
  }

  static createGenesisBlock(): Block {
    const index = 0;
    const previousHash = this.GENESIS_PREVIOUS_HASH;
    const timestamp = this.GENESIS_TIMESTAMP;
    const data: ParticipationRecord[] = [];
    const { hash, nonce } = this.mine(index, previousHash, timestamp, data);
    return { index, timestamp, data, previousHash, hash, nonce };
  }

  static generateNextBlock(lastBlock: Block, data: ParticipationRecord[]): Block {
    const index = lastBlock.index + 1;
    const previousHash = lastBlock.hash;
    const timestamp = Date.now();
    const { hash, nonce } = this.mine(index, previousHash, timestamp, data);
    return { index, timestamp, data, previousHash, hash, nonce };
  }

  static hasValidProofOfWork(block: Block): boolean {
    return block.hash.substring(0, this.DIFFICULTY) === '0'.repeat(this.DIFFICULTY);
  }

  static isValidGenesisBlock(block: Block): boolean {
    if (block.index !== 0) return false;
    if (block.previousHash !== this.GENESIS_PREVIOUS_HASH) return false;
    if (block.timestamp !== this.GENESIS_TIMESTAMP) return false;
    if (this.calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.nonce) !== block.hash) {
      return false;
    }
    return this.hasValidProofOfWork(block);
  }

  static isValidNewBlock(newBlock: Block, previousBlock: Block): boolean {
    if (previousBlock.index + 1 !== newBlock.index) return false;
    if (previousBlock.hash !== newBlock.previousHash) return false;
    if (this.calculateHash(newBlock.index, newBlock.previousHash, newBlock.timestamp, newBlock.data, newBlock.nonce) !== newBlock.hash) {
      return false;
    }
    return this.hasValidProofOfWork(newBlock);
  }

  static isValidChain(blocks: Block[]): boolean {
    if (blocks.length === 0) return true;
    if (!this.isValidGenesisBlock(blocks[0])) return false;
    for (let i = 1; i < blocks.length; i++) {
      if (!this.isValidNewBlock(blocks[i], blocks[i - 1])) return false;
    }
    return true;
  }

  static validateBlocks(blocks: Block[]): Set<number> {
    const valid = new Set<number>();
    if (blocks.length === 0) return valid;
    if (this.isValidGenesisBlock(blocks[0])) {
      valid.add(blocks[0].index);
    } else {
      return valid;
    }
    for (let i = 1; i < blocks.length; i++) {
      if (valid.has(blocks[i - 1].index) && this.isValidNewBlock(blocks[i], blocks[i - 1])) {
        valid.add(blocks[i].index);
      }
    }
    return valid;
  }
}
