<template>
    <div>
        <div class="upper-section-container">
            <span class="add-mosaic-button">
                <ButtonAdd title="Add NFT Mosaic" :disabled="false" @click="showMetadataModal = true" />
            </span>
        </div>
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
        <ModalNFTMosaicCreate v-if="showMetadataModal" :visible="showMetadataModal" :type="1" @close="showMetadataModal = false" />
    </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-var-requires */
// external dependencies
import { Component, Vue } from 'vue-property-decorator';
// child components
import FormMosaicDefinitionTransaction from '@/views/forms/FormMosaicDefinitionTransaction/FormMosaicDefinitionTransaction.vue';
import ModalTransactionConfirmation from '@/views/modals/ModalTransactionConfirmation/ModalTransactionConfirmation.vue';
import ModalNFTMosaicCreate from '@/views/modals/ModalNFTMosaicCreate/ModalNFTMosaicCreate.vue';
import NFTCardCollection from '@/components/NFTCardDisplay/NFTCardCollection.vue';
import { mapGetters } from 'vuex';
import { MosaicModel } from '@/core/database/entities/MosaicModel';
import { MetadataModel } from '@/core/database/entities/MetadataModel';
import ButtonAdd from '@/components/ButtonAdd/ButtonAdd.vue';
// @ts-ignore
@Component({
    components: {
        FormMosaicDefinitionTransaction,
        NFTCardCollection,
        ModalTransactionConfirmation,
        ButtonAdd,
        ModalNFTMosaicCreate,
    },
    computed: {
        ...mapGetters({
            holdMosaics: 'mosaic/holdMosaics',
            isFetchingMyCollection: 'marketplace/isFetchingMyCollection',
            myCollection: 'marketplace/myCollection',
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
    private myCollection: MosaicModel[];
    private isFetchingMyCollection: boolean;
    public showMetadataModal: boolean = false;
    public get isLoading() {
        return this.isFetchingMyCollection;
    }
    created() {
        this.$store.dispatch('marketplace/LOAD_MY_COLLECTION');
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
        return this.myCollection
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
<style lang="less" scoped>
@import './CollectionsPage.less';
</style>
