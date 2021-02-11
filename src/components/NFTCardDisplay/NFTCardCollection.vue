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
                    type="submit"
                    @click="transferMosaic(mosaicId)"
                >
                    Transfer
                </button>
                <button
                    class="button-style inverted-button fat-button"
                    style="cursor: pointer;"
                    type="submit"
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
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import ModalNFTMosaicSell from '@/views/modals/ModalNFTMosaicSell/ModalNFTMosaicSell.vue';
@Component({
    components: {
        ModalNFTMosaicSell,
    },
})
export default class NFTCardCollection extends Vue {
    @Prop({ required: true }) readonly title: string;
    @Prop({ required: true }) readonly cid: string;
    @Prop({ required: true }) readonly mosaicId: string;
    public showMosaicSellModal: boolean = false;
    public fileBlob: string = '';
    public fileType: string = '';
    transferMosaic(mosaicId: string) {
        alert('Mosaic to transfer: ' + mosaicId);
        console.log(this);
    }
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
}
</script>

<style lang="less" scoped>
@import './NFTCardDisplay.less';
</style>
