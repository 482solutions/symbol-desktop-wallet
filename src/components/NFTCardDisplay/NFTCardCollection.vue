<template v-slot="{ handleSubmit }">
    <div class="card-container">
        <div class="card-container-image">
            <Spin v-if="!fileBlob || !fileType" size="large" />
            <img v-if="fileType && fileType.indexOf('image') !== -1" :src="fileBlob" :alt="title" :title="title" class="card-image" />
            <video
                v-else-if="fileType && fileType.indexOf('video') !== -1"
                autoplay
                muted
                loop
                :src="fileBlob"
                class="card-image"
                :type="fileType"
            />
        </div>
        <div class="card-container-info">
            <a :href="'http://explorer.testnet.symboldev.network/mosaics/' + mosaicId" class="card-info-title" target="_blank">{{
                title
            }}</a>
            <div class="card-actions">
                <button
                    class="button-style inverted-button fat-button"
                    style="cursor: pointer;"
                    :disabled="onMarketplace"
                    @click="showTokenDetails = true"
                >
                    Transfer
                </button>
                <button
                    class="button-style inverted-button fat-button"
                    style="cursor: pointer;"
                    type="submit"
                    :disabled="onMarketplace"
                    @click="showMosaicSellModal = true"
                >
                    Sell
                </button>
            </div>
        </div>
        <ModalNFTMosaicSell
            v-if="showMosaicSellModal"
            :visible="showMosaicSellModal"
            :mosaic-id="mosaicId"
            :file-blob="fileBlob"
            :file-type="fileType"
            @close="showMosaicSellModal = false"
        />
        <Modal
            v-model="showTokenDetails"
            class-name="vertical-center-modal"
            :footer-hide="true"
            :transfer="false"
            @on-cancel="$emit('close-modal')"
        >
            <div class="token-details-modal">
                <div class="modal-title">Transfer</div>
                <a :href="`http://explorer.testnet.symboldev.network/mosaics/${mosaicId}`" class="token-link" target="_blank">
                    <a>{{ title }}</a>
                </a>
                <FormTransferToken
                    :mosaic-id="mosaicId"
                    :src="fileBlob"
                    :type="fileType"
                    @on-confirmation-success="showTokenDetails = false"
                />
            </div>
        </Modal>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import ModalNFTMosaicSell from '@/views/modals/ModalNFTMosaicSell/ModalNFTMosaicSell.vue';
import FormTransferToken from '@/views/forms/FormTransferToken/FormTransferToken.vue';
import { mapGetters } from 'vuex';

@Component({
    components: {
        ModalNFTMosaicSell,
        FormTransferToken,
    },
    computed: {
        ...mapGetters({
            holdMosaics: 'mosaic/holdMosaics',
            isFetchingMyCollection: 'marketplace/isFetchingMyCollection',
            myCollection: 'marketplace/myCollection',
            marketplaceList: 'marketplace/allTokens',
            isFetchingMarketplace: 'marketplace/isFetchingMarketplace',
        }),
    },
})
export default class NFTCardCollection extends Vue {
    @Prop({ required: true }) readonly title: string;
    @Prop({ required: true }) readonly cid: string;
    @Prop({ required: true }) readonly mosaicId: string;
    public onMarketplace: boolean = false;
    private marketplaceList;
    public showMosaicSellModal: boolean = false;
    public fileBlob: string = '';
    public fileType: string = '';
    public showTokenDetails: boolean = false;
    created() {
        this.getResource(`https://ipfs.io/ipfs/${this.cid}`);
    }
    getResource(url: string) {
        fetch(url, { method: 'GET' })
            .then((response: Response) => {
                this.fileType = response.headers.get('content-type');
                response.blob().then((blob) => {
                    this.fileBlob = URL.createObjectURL(blob);
                });
            })
            .catch(console.error);
    }
    checkNFTMosaicOnMarketPlace(id: string): boolean {
        if (this.marketplaceList.find((x) => x.id.toHex() === id) == -1) {
            return false;
        }
        return true;
    }
}
</script>

<style lang="less" scoped>
@import './NFTCardDisplay.less';
</style>
