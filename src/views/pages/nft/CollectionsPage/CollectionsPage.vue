<template>
  <div style="display: flex; flex-wrap: wrap;">
    <Spin v-if="isLoading" size="large" fix class="absolute"/>
    <NFTCardCollection
        v-for="(item, index) in cardInfo"
        v-else-if="!isLoading"
        :key="index"
        :title="item.nftData.title"
        :mosaic-id="item.hexId"
        :cid="item.nftData.CID"
    />
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-var-requires */
// external dependencies
import { Component, Vue } from 'vue-property-decorator';
import { Account, Address, NetworkType, } from 'symbol-sdk';
// child components
import AssetFormPageWrap from '@/views/pages/assets/AssetFormPageWrap/AssetFormPageWrap.vue';
import FormMosaicDefinitionTransaction
  from '@/views/forms/FormMosaicDefinitionTransaction/FormMosaicDefinitionTransaction.vue';
import NFTCardCollection from '@/components/NFTCardDisplay/NFTCardCollection.vue';
import { mapGetters } from 'vuex';
import { MosaicModel } from '@/core/database/entities/MosaicModel';
import { MosaicService } from '@/services/MosaicService';
import { NetworkConfigurationModel } from '@/core/database/entities/NetworkConfigurationModel';
import { MetadataModel } from '@/core/database/entities/MetadataModel';

const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('https://ipfs.infura.io:5001');
// @ts-ignore
@Component({
  components: { AssetFormPageWrap, FormMosaicDefinitionTransaction, NFTCardCollection },
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
  private isFetchingMosaics: boolean;
  private currentHeight: number;
  private networkConfiguration: NetworkConfigurationModel;
  private currentAccount: Account;
  private currentAccountAddress: Address;
  private networkType: NetworkType;
  private generationHash: string;
  private epochAdjustment: number;
  private nodeUrl: string;

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
