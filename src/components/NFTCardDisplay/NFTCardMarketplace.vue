<template v-slot="{ handleSubmit }">
    <div class="card-container card-marketplace">
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
            <a :href="'http://explorer.testnet.symboldev.network/mosaics/' + mosaicId" class="token-link" target="_blank">{{ title }}</a>

            <div class="card-footer">
                <div>
                    <div class="card-info-time">Expires in: {{ currentTime }}</div>
                    <div class="card-info-time">XYM: {{ price / Math.pow(10, 6) }}</div>
                </div>
                <button
                    class="button-style inverted-button fat-button"
                    style="cursor: pointer;"
                    type="submit"
                    @click="showBuyNFTModal = true"
                >
                    Buy
                </button>
            </div>
        </div>
        <ModalBuyNFT
            v-if="showBuyNFTModal"
            :file-blob="fileBlob"
            :file-type="fileType"
            :mosaic-id="mosaicId"
            :description="description"
            :title="title"
            :visible="showBuyNFTModal"
            :price="price / Math.pow(10, 6)"
            :time="currentTime"
            :hours="hours"
            :type="1"
            :holder-address="holderAddress"
            @close="showBuyNFTModal = false"
        />
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { MosaicModel } from '@/core/database/entities/MosaicModel';
import ModalBuyNFT from '@/views/modals/ModalBuyNFT/ModalBuyNFT.vue';

@Component({
    components: {
        ModalBuyNFT,
    },
})
export default class NFTCardMarketplace extends Vue {
    currentTime: string = null;
    @Prop({ required: true }) readonly title: string;
    @Prop({ required: true }) readonly description: string;
    @Prop({ required: true }) readonly cid: string;
    @Prop({ required: true }) readonly mosaicId: string;
    @Prop({ required: true }) readonly price: number;
    @Prop({ required: true }) readonly endDate: number;
    @Prop({ required: true }) readonly hours: number;
    @Prop({ required: true }) readonly holderAddress: string;
    showBuyNFTModal: boolean = false;
    public fileBlob: string = '';
    public fileType: string = '';
    holdMosaics: MosaicModel[];
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

    public async created() {
        this.currentTime = '00:00:00';
        setInterval(() => this.updateExpiresTime(), 1000);
        this.getResource(`https://ipfs.io/ipfs/${this.cid}`);
    }
    updateExpiresTime() {
        const endDate = this.$moment(this.endDate * 1000);
        const duration = this.$moment.duration(endDate.diff(this.$moment()));
        this.currentTime = `${duration.hours()}:${duration.minutes()}:${duration.seconds()}`;
    }
}
</script>

<style lang="less" scoped>
@import './NFTCardDisplay.less';
</style>
