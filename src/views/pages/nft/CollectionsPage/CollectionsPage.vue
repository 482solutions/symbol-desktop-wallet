<template
    ><div style="display: flex; flex-wrap: wrap;">
        <ModalTransactionConfirmation
            v-if="hasConfirmationModal"
            :command="command"
            :visible="hasConfirmationModal"
            @success="onConfirmationSuccess"
            @error="onConfirmationError"
            @close="onConfirmationCancel"
        />
        <NFTCardDisplay
            v-for="(item, index) in cardInfo"
            :key="index"
            :title="item.nftData.title"
            :mosaic-id="item.hexId"
            :cid="item.nftData.CID"
        />
        <input type="text" />
        <button @click="addNewToken()">Text</button>
    </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-var-requires */
// external dependencies
import { Component, Vue } from 'vue-property-decorator';
import {
    Account,
    AggregateTransaction,
    Deadline,
    KeyGenerator,
    AliasTransaction,
    MosaicDefinitionTransaction,
    MosaicFlags,
    MosaicId,
    MosaicMetadataTransaction,
    MosaicNonce,
    MosaicSupplyChangeAction,
    MosaicSupplyChangeTransaction,
    NamespaceRegistrationTransaction,
    NetworkType,
    RepositoryFactoryHttp,
    UInt64,
    AliasAction,
    NamespaceId,
    Address,
} from 'symbol-sdk';
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('https://ipfs.infura.io:5001');
// child components
import AssetFormPageWrap from '@/views/pages/assets/AssetFormPageWrap/AssetFormPageWrap.vue';
import FormMosaicDefinitionTransaction from '@/views/forms/FormMosaicDefinitionTransaction/FormMosaicDefinitionTransaction.vue';
import ModalTransactionConfirmation from '@/views/modals/ModalTransactionConfirmation/ModalTransactionConfirmation.vue';
import NFTCardDisplay from '@/components/NFTCardDisplay/NFTCardDisplay.vue';
import { mapGetters } from 'vuex';
import { MosaicModel } from '@/core/database/entities/MosaicModel';
import { MosaicService } from '@/services/MosaicService';
import { NetworkConfigurationModel } from '@/core/database/entities/NetworkConfigurationModel';
import { MetadataModel } from '@/core/database/entities/MetadataModel';

// @ts-ignore
@Component({
    components: { AssetFormPageWrap, FormMosaicDefinitionTransaction, NFTCardDisplay, ModalTransactionConfirmation },
    computed: {
        ...mapGetters({
            currentHeight: 'network/currentHeight',
            currentAccount: 'account/currentAccount',
            currentAccountAddress: 'account/currentAccountAddress',
            holdMosaics: 'mosaic/holdMosaics',
            networkConfiguration: 'network/networkConfiguration',
            attachedMetadataList: 'metadata/accountMetadataList',
            isFetchingMosaics: 'mosaic/isFetchingMosaics',
            isFetchingMetadata: 'metadata/isFetchingMetadata',
            generationHash: 'network/generationHash',
            networkType: 'network/networkType',
            epochAdjustment: 'network/epochAdjustment',
            nodeUrl: 'network/nodeUrl',
        }),
    },
})
export default class CollectionsPage extends Vue {
    /**
     * Current account owned mosaics
     * @protected
     * @type {MosaicModel[]}
     */
    private holdMosaics: MosaicModel[];
    private currentHeight: number;
    private networkConfiguration: NetworkConfigurationModel;
    private currentAccount: Account;
    private currentAccountAddress: Address;
    private networkType: NetworkType;
    private generationHash: string;
    private epochAdjustment: number;
    private nodeUrl: string;

    protected parseMetaData(metaData: MetadataModel[]) {
        return metaData.map((metaItem) => {
            try {
                return JSON.parse(metaItem.value);
            } catch (e) {
                return;
            }
        });
    }

    get cardInfo() {
        const mosaicsInfo = this.holdMosaics;
        console.log(mosaicsInfo);
        return mosaicsInfo
            .map((mosaicInfo) => {
                const expiration = MosaicService.getExpiration(
                    mosaicInfo,
                    this.currentHeight,
                    this.networkConfiguration.blockGenerationTargetTime,
                );
                const metadata = this.parseMetaData(mosaicInfo.metadataList);
                if (metadata.length === 0 || mosaicInfo.balance === 0) {
                    return;
                }
                // - map table fields
                return {
                    hexId: mosaicInfo.mosaicIdHex,
                    name: mosaicInfo.name || 'N/A',
                    supply: mosaicInfo.supply.toLocaleString(),
                    balance: (mosaicInfo.balance || 0) / Math.pow(10, mosaicInfo.divisibility),
                    expiration: expiration,
                    divisibility: mosaicInfo.divisibility,
                    transferable: mosaicInfo.transferable,
                    supplyMutable: mosaicInfo.supplyMutable,
                    restrictable: mosaicInfo.restrictable,
                    nftData: metadata[0],
                };
            })
            .filter((x) => x);
    }

    public async addNewToken(rootNamespase: string, subNamespase: string, title: string, fee: number, file) {
        rootNamespase = 'propisnie';
        subNamespase = 'aaa';
        title = 'bbb';
        fee = 2000000;
        const ipfsHash = await ipfs.add('this.state.buffer');
        const nftInfo = {
            CID: ipfsHash.path,
            title,
        };
        const nftInfoStr = JSON.stringify(nftInfo);
        const duration = UInt64.fromUint(0);
        const serviceFee = fee * 10;
        const isSupplyMutable = false;
        const isTransferable = true;
        console.log(ipfsHash);
        const isRestrictable = true;
        const divisibility = 0;
        const nonce = MosaicNonce.createRandom();
        const mosaicId = MosaicId.createFromNonce(nonce, this.currentAccountAddress);
        const namespaceId = new NamespaceId(`${rootNamespase}.${subNamespase}`);
        console.log(mosaicId.toHex());

        const namespaceRegistrationTransaction = NamespaceRegistrationTransaction.createSubNamespace(
            Deadline.create(this.epochAdjustment),
            subNamespase,
            rootNamespase,
            this.networkType,
        );

        const mosaicDefinitionTransaction = MosaicDefinitionTransaction.create(
            Deadline.create(this.epochAdjustment),
            nonce,
            mosaicId,
            MosaicFlags.create(isSupplyMutable, isTransferable, isRestrictable),
            divisibility,
            duration,
            this.networkType,
        );

        const mosaicSupplyChangeTransaction = MosaicSupplyChangeTransaction.create(
            Deadline.create(this.epochAdjustment),
            mosaicDefinitionTransaction.mosaicId,
            MosaicSupplyChangeAction.Increase,
            UInt64.fromUint(1),
            this.networkType,
        );

        const linkMetadataTransaction = MosaicMetadataTransaction.create(
            Deadline.create(this.epochAdjustment),
            this.currentAccount.address,
            KeyGenerator.generateUInt64Key('NFT'),
            mosaicId,
            nftInfoStr.length,
            nftInfoStr,
            this.networkType,
        );

        const mosaicAliasTransaction = AliasTransaction.createForMosaic(
            Deadline.create(this.epochAdjustment),
            AliasAction.Link,
            namespaceId,
            mosaicId,
            this.networkType,
        );

        const aggregateTransaction = AggregateTransaction.createComplete(
            Deadline.create(this.epochAdjustment),
            [
                namespaceRegistrationTransaction.toAggregate(this.currentAccount.publicAccount),
                mosaicDefinitionTransaction.toAggregate(this.currentAccount.publicAccount),
                mosaicSupplyChangeTransaction.toAggregate(this.currentAccount.publicAccount),
                linkMetadataTransaction.toAggregate(this.currentAccount.publicAccount),
                mosaicAliasTransaction.toAggregate(this.currentAccount.publicAccount),
            ],
            this.networkType,
            [],
            UInt64.fromUint(fee),
        );
        const signedTransaction = this.currentAccount.sign(aggregateTransaction, this.generationHash);
        const repositoryFactory = new RepositoryFactoryHttp(this.nodeUrl);
        console.log(ipfsHash);
        const transactionHttp = repositoryFactory.createTransactionRepository();
        transactionHttp.announce(signedTransaction).subscribe(
            (x) => console.log(x),
            (err) => console.error(err),
        );
    }
}
</script>
