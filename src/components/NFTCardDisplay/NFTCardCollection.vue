<template v-slot="{ handleSubmit }">
    <div class="card-container">
        <div class="card-container-image">
            <Spin v-if="!fileBlob || !fileType" size="large" fix />
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
                    @click="sellMosaic(mosaicId)"
                >
                    Sell
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class NFTCardCollection extends Vue {
    @Prop({ required: true }) readonly title: string;
    @Prop({ required: true }) readonly cid: string;
    @Prop({ required: true }) readonly mosaicId: string;
    public fileBlob: string = '';
    public fileType: string = '';
    transferMosaic(mosaicId: string) {
        alert('Mosaic to transfer: ' + mosaicId);
        console.log(this);
    }
    sellMosaic(mosaicId: string) {
        alert('Mosaic to sell: ' + mosaicId);
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
