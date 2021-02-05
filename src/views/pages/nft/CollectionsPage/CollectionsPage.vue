<template>
    <div style="display: flex; flex-wrap: wrap;">
        <Spin v-if="isLoading" size="large" fix class="absolute" />
        <NFTCardCollection
            v-for="(item, index) in cardInfo"
            v-else-if="!isLoading"
            :key="index"
            :title="item.nftData.title"
            :mosaic-id="item.hexId"
            :cid="item.nftData.CID"
        />
        <button class="button-style inverted-button fat-button" @click="addNewToken()">Add Token</button>
        <ModalTransactionConfirmation
            v-if="hasConfirmationModal"
            :command="command"
            :visible="hasConfirmationModal"
            @success="onConfirmationSuccess"
            @error="onConfirmationError"
            @close="onConfirmationCancel"
        />
    </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-var-requires */
// external dependencies
import { Component } from 'vue-property-decorator';
import {
    Address,
    AliasAction,
    AliasTransaction,
    KeyGenerator,
    Mosaic,
    MosaicDefinitionTransaction,
    MosaicFlags,
    MosaicId,
    MosaicMetadataTransaction,
    MosaicNonce,
    MosaicSupplyChangeAction,
    MosaicSupplyChangeTransaction,
    NamespaceId,
    NamespaceRegistrationTransaction,
    PlainMessage,
    Transaction,
    TransferTransaction,
    UInt64,
} from 'symbol-sdk';
// child components
import AssetFormPageWrap from '@/views/pages/assets/AssetFormPageWrap/AssetFormPageWrap.vue';
import FormMosaicDefinitionTransaction from '@/views/forms/FormMosaicDefinitionTransaction/FormMosaicDefinitionTransaction.vue';
import ModalTransactionConfirmation from '@/views/modals/ModalTransactionConfirmation/ModalTransactionConfirmation.vue';
import NFTCardCollection from '@/components/NFTCardDisplay/NFTCardCollection.vue';
import { mapGetters } from 'vuex';
import { MosaicModel } from '@/core/database/entities/MosaicModel';
import { MetadataModel } from '@/core/database/entities/MetadataModel';
import { FormTransactionBase } from '@/views/forms/FormTransactionBase/FormTransactionBase';

const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('https://ipfs.infura.io:5001');
// @ts-ignore
@Component({
    components: { AssetFormPageWrap, FormMosaicDefinitionTransaction, NFTCardCollection, ModalTransactionConfirmation },
    computed: {
        ...mapGetters({
            currentHeight: 'network/currentHeight',
            currentAccountAddress: 'account/currentAccountAddress',
            holdMosaics: 'mosaic/holdMosaics',
            networkConfiguration: 'network/networkConfiguration',
            attachedMetadataList: 'metadata/accountMetadataList',
            isFetchingMosaics: 'mosaic/isFetchingMosaics',
            isFetchingMetadata: 'metadata/isFetchingMetadata',
            generationHash: 'network/generationHash',
            networkType: 'network/networkType',
            epochAdjustment: 'network/epochAdjustment',
            networkMosaic: 'mosaic/networkMosaic',
            serviceAddress: 'marketplace/serviceAddress',
        }),
    },
})
export default class CollectionsPage extends FormTransactionBase {
    /**
     * Current account owned mosaics
     * @protected
     * @type {MosaicModel[]}
     */
    private holdMosaics: MosaicModel[];
    private isFetchingMosaics: boolean;
    private currentAccountAddress: Address;
    private serviceAddress: Address;
    public formItems = {
        maxFee: 2000000,
        rootNamespace: 'solutions',
        subNamespace: 'laptop',
        title: 'Laptop',
        nftFile: 'MacBook Pro 16',
    };
    private nftFileCid: string;
    public get isLoading() {
        return this.isFetchingMosaics;
    }

    protected isJSONValid(jsonInString: string): boolean {
        try {
            JSON.parse(jsonInString);
            return true;
        } catch (e) {
            return false;
        }
    }

    protected parseMetaData(metaData: MetadataModel[]) {
        return metaData
            .map((metaItem: MetadataModel) => {
                if (this.isJSONValid(metaItem.value)) {
                    return JSON.parse(metaItem.value);
                }
            })
            .filter((x) => x);
    }

    get cardInfo() {
        const mosaicsInfo = this.holdMosaics;
        return mosaicsInfo
            .filter((mosaic) => mosaic.balance === 1 && mosaic.metadataList.length > 0)
            .map((mosaic) => {
                const nftInfo = this.parseMetaData(mosaic.metadataList);
                return {
                    hexId: mosaic.mosaicIdHex,
                    name: mosaic.name || 'N/A',
                    balance: (mosaic.balance || 0) / Math.pow(10, mosaic.divisibility),
                    divisibility: mosaic.divisibility,
                    nftData: nftInfo[0],
                };
            })
            .filter((x) => x);
    }
    protected async uploadNFTFile(): Promise<string> {
        const ipfsHash = await ipfs.add(this.formItems.nftFile);
        return ipfsHash.path;
    }

    protected formatNFTInfo(CID: string): { title: string; CID: string } {
        return {
            title: this.formItems.title,
            CID,
        };
    }
    protected getTransactions(): Transaction[] {
        const nonce = MosaicNonce.createRandom();
        const mosaicId = MosaicId.createFromNonce(nonce, this.currentAccountAddress);
        const namespaceId = new NamespaceId(`${this.formItems.rootNamespace}.${this.formItems.subNamespace}`);
        const nftInfo = JSON.stringify(this.formatNFTInfo(this.nftFileCid));
        const aggregateTransactions = [
            this.createTransferServiceFeeTx(),
            this.createSubNamespaceRegistrationTx(),
            this.createNFTMosaicTx({ nonce, mosaicId }),
            this.createMintNFTMosaicTx({ mosaicId }),
            this.createMetaDataForNFTMosaicTx({ mosaicId, nftInfo }),
            this.createLinkAliasForNFTMosaicTx({ mosaicId, namespaceId }),
        ];
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
            [new Mosaic(this.networkMosaic, UInt64.fromUint(this.formItems.maxFee * 10))],
            PlainMessage.create('Marketplace service fee'),
            this.networkType,
            maxFee,
        );
    }

    private createSubNamespaceRegistrationTx(): Transaction {
        const maxFee = UInt64.fromUint(this.formItems.maxFee);
        return NamespaceRegistrationTransaction.createSubNamespace(
            this.createDeadline(),
            this.formItems.subNamespace,
            this.formItems.rootNamespace,
            this.networkType,
            maxFee,
        );
    }

    private createNFTMosaicTx(tx: { nonce: MosaicNonce; mosaicId: MosaicId }): Transaction {
        const maxFee = UInt64.fromUint(this.formItems.maxFee);
        return MosaicDefinitionTransaction.create(
            this.createDeadline(),
            tx.nonce,
            tx.mosaicId,
            MosaicFlags.create(false, true, true),
            0,
            UInt64.fromUint(0),
            this.networkType,
            maxFee,
        );
    }

    private createMintNFTMosaicTx(tx: { mosaicId: MosaicId }): Transaction {
        const maxFee = UInt64.fromUint(this.formItems.maxFee);
        return MosaicSupplyChangeTransaction.create(
            this.createDeadline(),
            tx.mosaicId,
            MosaicSupplyChangeAction.Increase,
            UInt64.fromUint(1),
            this.networkType,
            maxFee,
        );
    }

    private createMetaDataForNFTMosaicTx(tx: { mosaicId: MosaicId; nftInfo: string }): Transaction {
        const maxFee = UInt64.fromUint(this.formItems.maxFee);
        return MosaicMetadataTransaction.create(
            this.createDeadline(),
            this.currentSignerAddress,
            KeyGenerator.generateUInt64Key('NFT'),
            tx.mosaicId,
            tx.nftInfo.length,
            tx.nftInfo,
            this.networkType,
            maxFee,
        );
    }

    private createLinkAliasForNFTMosaicTx(tx: { mosaicId: MosaicId; namespaceId: NamespaceId }): Transaction {
        const maxFee = UInt64.fromUint(this.formItems.maxFee);
        return AliasTransaction.createForMosaic(
            this.createDeadline(),
            AliasAction.Link,
            tx.namespaceId,
            tx.mosaicId,
            this.networkType,
            maxFee,
        );
    }
    public async addNewToken() {
        this.nftFileCid = await this.uploadNFTFile();
        this.onSubmit();
    }
}
</script>
