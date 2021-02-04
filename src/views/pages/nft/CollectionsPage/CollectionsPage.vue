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
    </div>
</template>

<script lang="ts">
// external dependencies
import { Component, Vue } from 'vue-property-decorator';

// child components
import AssetFormPageWrap from '@/views/pages/assets/AssetFormPageWrap/AssetFormPageWrap.vue';
import FormMosaicDefinitionTransaction from '@/views/forms/FormMosaicDefinitionTransaction/FormMosaicDefinitionTransaction.vue';
import NFTCardCollection from '@/components/NFTCardDisplay/NFTCardCollection.vue';
import { mapGetters } from 'vuex';
import { MosaicModel } from '@/core/database/entities/MosaicModel';
import { MetadataModel } from '@/core/database/entities/MetadataModel';
// @ts-ignore
@Component({
    components: { AssetFormPageWrap, FormMosaicDefinitionTransaction, NFTCardCollection },
    computed: {
        ...mapGetters({
            currentHeight: 'network/currentHeight',
            currentAccount: 'account/currentAccount',
            holdMosaics: 'mosaic/holdMosaics',
            networkConfiguration: 'network/networkConfiguration',
            attachedMetadataList: 'metadata/accountMetadataList',
            isFetchingMosaics: 'mosaic/isFetchingMosaics',
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
}
</script>
