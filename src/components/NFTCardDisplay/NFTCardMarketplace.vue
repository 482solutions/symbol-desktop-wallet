<template v-slot="{ handleSubmit }">
    <div class="card-container card-marketplace">
        <div class="card-container-image">
            <img :src="'https://cloudflare-ipfs.com/ipfs/' + cid" :alt="title" :title="title" class="card-image" />
        </div>
        <div class="card-container-info">
            <a :href="'http://explorer.testnet.symboldev.network/mosaics/' + mosaicId" class="card-info-title" target="_blank">{{
                title
            }}</a>

            <div class="card-footer">
                <div>
                    <div class="card-info-time">Expires in: {{ currentTime }}</div>
                    <div class="card-info-time">XYM: {{ price / Math.pow(10, 6) }}</div>
                </div>
                <button class="button-style inverted-button fat-button" style="cursor: pointer;" type="submit" @click="buyMosaic(mosaicId)">
                    Buy
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { Address, Mosaic, MosaicId, MosaicNonce, PlainMessage, Transaction, TransferTransaction, UInt64 } from 'symbol-sdk';
import { MosaicModel } from '@/core/database/entities/MosaicModel';
import { FormTransactionBase } from '@/views/forms/FormTransactionBase/FormTransactionBase';

type timePeriodType = 6 | 12 | 24 | 48;
@Component
export default class NFTCardMarketplace extends FormTransactionBase {
    currentTime: string = null;
    @Prop({ required: true }) readonly title: string;
    @Prop({ required: true }) readonly cid: string;
    @Prop({ required: true }) readonly mosaicId: string;
    @Prop({ required: true }) readonly price: number;
    @Prop({ required: true }) readonly endDate: number;
    nftInfo = this.nftPrice(100, 0.05, 12);
    nftMosaicId = new MosaicId('nftMosaicIdHex');
    nftMosaicDivisibility = 0;
    networkMosaicDivisibility = 6;
    holdMosaics: MosaicModel[];
    currentAccountAddress: Address;
    sellerAccountAddress: Address;
    serviceAddress: Address;

    public formItems = {
        maxFee: 2000000,
        rootNamespace: 'solutions',
        subNamespace: 'laptop',
        title: 'Laptop',
        nftFile: 'MacBook Pro 16',
    };
    private nftFileCid: string;

    buyMosaic(mosaicId: string) {
        alert('Mosaic to buy: ' + mosaicId);
    }
    mounted() {
        this.currentTime = '00:00:00';
        setInterval(() => this.updateExpiresTime(), 1000);
    }

    updateExpiresTime() {
        const endDate = this.$moment(this.endDate * 1000);
        const duration = this.$moment.duration(endDate.diff(this.$moment()));
        this.currentTime = `${duration.hours()}:${duration.minutes()}:${duration.seconds()}`;
    }

    protected isJSONValid(jsonInString: string): boolean {
        try {
            JSON.parse(jsonInString);
            return true;
        } catch (e) {
            return false;
        }
    }
    protected getTransactions(): Transaction[] {
        const nonce = MosaicNonce.createRandom();
        const mosaicId = MosaicId.createFromNonce(nonce, this.currentAccountAddress);
        const aggregateTransactions = [this.createTransferServiceFeeTx(), this.buyerToSellerTx(), this.sellerToBuyerTx({ mosaicId })];
        return aggregateTransactions;
    }
    protected resetForm() {
        console.log('resetForm');
    }

    private createTransferServiceFeeTx(): Transaction {
        const maxFee = UInt64.fromUint(this.formItems.maxFee);
        return TransferTransaction.create(
            this.createDeadline(),
            this.serviceAddress,
            [new Mosaic(this.networkMosaic, UInt64.fromUint(this.nftInfo.serviceFee))],
            PlainMessage.create('Marketplace service fee'),
            this.networkType,
            maxFee,
        );
    }

    private buyerToSellerTx(): Transaction {
        const maxFee = UInt64.fromUint(this.formItems.maxFee);
        return TransferTransaction.create(
            this.createDeadline(),
            this.sellerAccountAddress,
            [new Mosaic(this.nftMosaicId, UInt64.fromUint(this.nftInfo.amountToSeller * Math.pow(10, this.networkMosaicDivisibility)))],
            PlainMessage.create(`send ${this.nftInfo.amountToSeller} symbol.xym to seller`),
            this.networkType,
            maxFee,
        );
    }

    private sellerToBuyerTx(tx: { mosaicId: MosaicId }): Transaction {
        const maxFee = UInt64.fromUint(this.formItems.maxFee);
        return TransferTransaction.create(
            this.createDeadline(),
            this.currentAccountAddress,
            [new Mosaic(this.nftMosaicId, UInt64.fromUint(Math.pow(10, this.nftMosaicDivisibility)))],
            PlainMessage.create('send 1 nft token to customer'),
            this.networkType,
            maxFee,
        );
    }

    private nftPrice(price: number, fee: number, time: timePeriodType) {
        const timeConstant = {
            6: 0,
            12: 2,
            24: 3,
            48: 4,
        };
        const serviceFee = price * 0.025 + timeConstant[time] * fee;
        return {
            total: price,
            fee: fee,
            time: time,
            serviceFee,
            amountToSeller: price - serviceFee,
        };
    }
}
</script>

<style lang="less" scoped>
@import './NFTCardDisplay.less';
</style>
