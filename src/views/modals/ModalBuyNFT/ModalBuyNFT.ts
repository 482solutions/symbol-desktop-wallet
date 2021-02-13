/*
 * Copyright 2020 NEM (https://nem.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 *
 */
import { Component, Prop } from 'vue-property-decorator';

// child components
// @ts-ignore
import TransactionDetails from '@/components/TransactionDetails/TransactionDetails.vue';
import ModalTransactionConfirmation from '@/views/modals/ModalTransactionConfirmation/ModalTransactionConfirmation.vue';
import { FormTransactionBase } from '@/views/forms/FormTransactionBase/FormTransactionBase';
import { Address, Mosaic, MosaicId, PlainMessage, PublicAccount, Transaction, TransferTransaction, UInt64 } from 'symbol-sdk';
import { mapGetters } from 'vuex';
import MaxFeeAndSubmit from '@/components/MaxFeeAndSubmit/MaxFeeAndSubmit.vue';
import { TransactionCommand, TransactionCommandMode } from '@/services/TransactionCommand';
import { MarketplaceConfig } from '@/config';

@Component({
    computed: {
        ...mapGetters({
            knownAccounts: 'account/knownAccounts',
            ownedMosaics: 'mosaic/ownedMosaics',
            ownedNamespaces: 'namespace/ownedNamespaces',
            repositoryFactory: 'network/repositoryFactory',
            metadataTransactions: 'metadata/transactions',
            currentAccountAddress: 'account/currentAccountAddress',
            serviceAddress: 'marketplace/serviceAddress',
        }),
    },
    components: {
        TransactionDetails,
        ModalTransactionConfirmation,
        MaxFeeAndSubmit,
    },
})
export class ModalBuyNFTts extends FormTransactionBase {
    @Prop({
        default: false,
    })
    visible: boolean;

    @Prop({
        required: true,
    })
    fileType: string;

    @Prop({
        required: true,
    })
    fileBlob: string;

    @Prop({
        required: true,
    })
    mosaicId: string;

    @Prop({
        required: true,
    })
    description: string;

    @Prop({
        required: true,
    })
    price: string;

    @Prop({
        required: true,
    })
    time: string;
    @Prop({
        required: true,
    })
    hours: number;

    @Prop({
        required: true,
    })
    title: string;

    @Prop({ required: true })
    readonly holderAddress: string;

    maxFee: number = 1000000;
    serviceAddress: Address;
    currentAccountAddress: Address;
    sellerAccountAddress: Address;
    sellerPublicAccount: PublicAccount;
    nftInfo: { total: number; fee: number; time: number; serviceFee: number; amountToSeller: number };
    networkMosaicDivisibility = 6;
    /// region computed properties
    public async created() {
        this.$store.dispatch('network/LOAD_TRANSACTION_FEES');
        this.sellerAccountAddress = Address.createFromPublicKey(this.holderAddress, this.networkType);
        this.sellerPublicAccount = PublicAccount.createFromPublicKey(this.holderAddress, this.networkType);
        this.resetForm();
    }
    /**
     * Visibility state
     * @type {boolean}
     */
    public get show(): boolean {
        return this.visible;
    }
    /**
     * Emits close event
     */
    public set show(val) {
        if (!val) {
            this.$emit('close');
        }
    }
    public createTransactionCommand(): TransactionCommand {
        const transactions = this.getTransactions();
        const mode = TransactionCommandMode.MULTISIGN;
        return new TransactionCommand(
            mode,
            this.selectedSigner,
            this.currentSignerPublicKey,
            transactions,
            this.networkMosaic,
            this.generationHash,
            this.networkType,
            this.epochAdjustment,
            this.networkConfiguration,
            this.transactionFees,
            this.requiredCosignatures,
        );
    }

    /**
     * Hook called when the child component ModalTransactionConfirmation triggers
     * the event 'success'
     */
    public onConfirmationSuccess() {
        // if the form was in multisig, set the signer to be the main account
        // this triggers resetForm in the @Watch('currentAccount') hook
        if (this.isMultisigMode()) {
            this.$store.dispatch('account/SET_CURRENT_ACCOUNT', this.currentAccount);
        }
        this.resetForm();
        this.hasConfirmationModal = false;
        this.$emit('on-confirmation-success');
        this.removeTokenFromMarketRequest();
    }

    protected getTransactions(): Transaction[] {
        this.nftInfo = ModalBuyNFTts.nftPrice(Number(this.price), this.maxFee, this.hours);
        const mosaicId = new MosaicId(this.mosaicId);
        return [this.createTransferServiceFeeTx(), this.buyerToSellerTx(), this.sellerToBuyerTx({ mosaicId })];
    }

    protected resetForm() {
        console.log('resetForm');
    }
    public async removeTokenFromMarketRequest(): Promise<void> {
        const url = `${MarketplaceConfig.marketplaceServer}tokens/?id=${this.mosaicId}`;
        await fetch(url, {
            method: 'DELETE',
        });
    }
    private createTransferServiceFeeTx(): Transaction {
        const maxFee = UInt64.fromUint(this.maxFee);
        return TransferTransaction.create(
            this.createDeadline(),
            this.serviceAddress,
            [new Mosaic(this.networkMosaic, UInt64.fromUint(this.nftInfo.serviceFee * Math.pow(10, this.networkMosaicDivisibility)))],
            PlainMessage.create('Marketplace service fee'),
            this.networkType,
            maxFee,
        );
    }
    private buyerToSellerTx(): Transaction {
        const maxFee = UInt64.fromUint(this.maxFee);
        return TransferTransaction.create(
            this.createDeadline(),
            this.sellerAccountAddress,
            [new Mosaic(this.networkMosaic, UInt64.fromUint(this.nftInfo.amountToSeller * Math.pow(10, this.networkMosaicDivisibility)))],
            PlainMessage.create(`send ${this.nftInfo.amountToSeller} symbol.xym to seller`),
            this.networkType,
            maxFee,
        );
    }

    private sellerToBuyerTx(tx: { mosaicId: MosaicId }): Transaction {
        const maxFee = UInt64.fromUint(this.maxFee);
        console.log(`this.sellerPublicAccount:`, this.sellerPublicAccount);
        return TransferTransaction.create(
            this.createDeadline(),
            this.currentAccountAddress,
            [new Mosaic(tx.mosaicId, UInt64.fromUint(1))],
            PlainMessage.create('send 1 nft token to customer'),
            this.networkType,
            maxFee,
            undefined,
            this.sellerPublicAccount,
        );
    }
    private static nftPrice(
        price: number,
        fee: number,
        time: number,
    ): { total: number; fee: number; time: number; serviceFee: number; amountToSeller: number } {
        const timeConstant = {
            6: 0,
            12: 2,
            24: 3,
            48: 4,
        };
        const serviceFee = price * 0.025 + timeConstant[time] * (fee / Math.pow(10, 6));
        return {
            total: price,
            fee: fee,
            time: time,
            serviceFee,
            amountToSeller: price - serviceFee,
        };
    }
}
