<template>
    <div style="display: flex; flex-wrap: wrap;">
        <Spin v-if="isLoading" size="large" fix class="absolute" />
        <NFTCardMarketplace
            v-for="(item, index) in cardInfo"
            v-else-if="!isLoading"
            :key="index"
            :title="item.nftData.title"
            :mosaic-id="item.hexId"
            :cid="item.nftData.CID"
            :price="item.price"
            :end-date="item.endDate"
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
import { MosaicService } from '@/services/MosaicService';
import { NetworkConfigurationModel } from '@/core/database/entities/NetworkConfigurationModel';
import { MetadataModel } from '@/core/database/entities/MetadataModel';
import { MosaicMarketplace } from '@/services/MarketplaceService';
import NFTCardMarketplace from '@/components/NFTCardDisplay/NFTCardMarketplace.vue';
import { TableAssetType } from '@/components/TableDisplay/TableAssetType';

// @ts-ignore
@Component({
    components: { NFTCardMarketplace, AssetFormPageWrap, FormMosaicDefinitionTransaction, NFTCardCollection },
    computed: {
        ...mapGetters({
            currentHeight: 'network/currentHeight',
            currentAccount: 'account/currentAccount',
            holdMosaics: 'mosaic/holdMosaics',
            networkConfiguration: 'network/networkConfiguration',
            attachedMetadataList: 'metadata/accountMetadataList',
            isFetchingMosaics: 'mosaic/isFetchingMosaics',
            isFetchingMetadata: 'metadata/isFetchingMetadata',
            marketplaceList: 'marketplace/allTokens',
            isFetchingMarketplace: 'marketplace/isFetchingMarketplace',
        }),
    },
})
export default class NftMarketplacePage extends Vue {
    /**
     * Current account owned mosaics
     * @protected
     * @type {MosaicModel[]}
     */
    private isFetchingMarketplace: boolean;
    private marketplaceList: MosaicMarketplace[];
    created() {
        this.$store.dispatch('marketplace/FETCH_TOKENS');
    }
    protected parseMetaData(metaData: MetadataModel[]) {
        return metaData.map((metaItem) => {
            try {
                return JSON.parse(metaItem.value);
            } catch (e) {
                return;
            }
        });
    }
    public get isLoading() {
        return this.isFetchingMarketplace;
    }
    get cardInfo() {
        const mosaicsInfo = this.marketplaceList;
        return mosaicsInfo
            .map((mosaicInfo) => {
                const metadata = this.parseMetaData(mosaicInfo.metadataList);
                if (metadata.length === 0) {
                    return;
                }
                // - map table fields
                return {
                    hexId: mosaicInfo.id.toHex(),
                    // name: mosaicInfo.name || 'N/A',
                    supply: mosaicInfo.supply.toLocaleString(),
                    divisibility: mosaicInfo.divisibility,
                    price: mosaicInfo.price,
                    endDate: mosaicInfo.endDate,
                    nftData: metadata[0],
                };
            })
            .filter((x) => x);
    }
}
</script>
<style lang="less" scoped></style>
