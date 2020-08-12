import * as CryptoJS from 'crypto-js';
import {broadcastLatest} from './p2p';

class Block {
    public index: number;
    public hash: string;
    public previousHash: string;
    public timestamp: number;
    public data: string;

    constructor(index: number, hash: string, previousHash: string, timestamp: number, data: string) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
    }
}

const genesisBlock: Block = new Block(
    0,'816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7','',1465154705,'first genesis block!!'
);

let blockchain: Block[] = [genesisBlock];

const getBlockchain = (): Block[] => blockchain;
const getLatestBlock = (): Block => blockchain[blockchain.length - 1];

const generateNextBlock =(blockData: string) =>{
    const previousBlock: Block = getLatestBlock();
    const nextIndex: number = previousBlock.index +1;
    const nextTimestamp: number = new Date().getTime() / 1000;

    const nextHash: string = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
    const newBlock: Block = new Block(nextIndex, nextHash, previousBlock.hash, nextTimestamp, blockData);
    addBlock(newBlock);
    broadcastLatest();
    return newBlock;
}

const calculateHashForBlock = (block:Block): string =>
    calculateHash(block.index, block.previousHash, block.timestamp, block.data);

const calculateHash = (index: number, previousHash: string, timestamp: number, data: string): string =>
    CryptoJS.SHA256(index+previousHash+timestamp+data).toString();

const addBlock = (newBlock: Block) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        blockchain.push(newBlock);
    }
}

const isValidBlockStructure = (block: Block): boolean => {  
    return typeof block.index === 'number'
        && typeof block.hash === 'string'
        && typeof block.previousHash === 'string'
        && typeof block.timestamp === 'number'
        && typeof block.data === 'string';
};

const isValidNewBlock = (newBlock: Block, previousBlock: Block): boolean => {
    if (!isValidBlockStructure(newBlock)) {
        console.log('invalid structure');
        return false;
    }
    // 블록의 index에 이전 블록의 index 보다 1이 커야 한다. 그렇지 않으면, false 를 반환한다. 
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    } 
    //  블록의 previousHash 와 이전 블록의 hash 가 일치해야 한다.  그렇지 않으면, false 를 반환한다.
    else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previoushash');
        return false;
    } 
    // 블록의 hash 값 자체가 유효해야 한다. 그렇지 않으면, false 를 반환한다.
    else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock));
        console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
        return false;
    }
    // 3가지 조건이 모두 성립하면 true 를 반환한다. 
    return true;
};

const isValidChain = (blockchainToValidate: Block[]): boolean => {
    // 체인의 첫 번째 블록이 genesisBlock 과 일치하는지 확인한다. 
    const isValidGenesis = (block: Block): boolean => {
        return JSON.stringify(block) === JSON.stringify(genesisBlock);
    };
    if (!isValidGenesis(blockchainToValidate[0])) {
        return false;
    }
    // isValidnewBlock 을 통하여 전체 체인을 검증한다. 
    for (let i = 1; i < blockchainToValidate.length; i++) {
        if (!isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1])) {
            return false;
        }
    }
    return true;
};

const addBlockToChain = (newBlock: Block) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        blockchain.push(newBlock);
        return true;
    }
    return false;
};

const replaceChain = (newBlocks: Block[]) => {
    // code 1_4 에서 정의된 getBlockchain과 code 1_7 에서 정의된 isValidChain 을 사용한다. 
    // 새로운 chain 이 유효한 chain 이고 그 chain 이 기존의 것보다 더 길면 교체된다. 
    if (isValidChain(newBlocks) && newBlocks.length > getBlockchain().length) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain');
        blockchain = newBlocks;
        broadcastLatest();
    }
    // 위의 2가지 조건 중 1개라도 만족하지 못하면 교체되지 않는다. 
    else {
        console.log('Received blockchain invalid');
    }
};

export {Block, getBlockchain, getLatestBlock, generateNextBlock, isValidBlockStructure, replaceChain, addBlockToChain};