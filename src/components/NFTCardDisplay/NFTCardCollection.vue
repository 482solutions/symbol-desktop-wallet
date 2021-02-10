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
                    :disabled="false"
                    @click="showTokenDetails = true"
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
        <Modal
            v-model="showTokenDetails"
            class-name="vertical-center-modal"
            :footer-hide="true"
            :transfer="false"
            @on-cancel="$emit('close-modal')"
        >
            <div class="token-details-modal">
                <div class="modal-title">Transfer</div>
                <FormTransferTransaction @on-confirmation-success="showTokenDetails = false" />
            </div>
        </Modal>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import FormTransferTransaction from '@/views/forms/FormTransferTransaction/FormTransferTransaction.vue';

@Component({
    components: {
        FormTransferTransaction,
    },
})
export default class NFTCardCollection extends Vue {
    @Prop({ required: true }) readonly title: string;
    @Prop({ required: true }) readonly cid: string;
    @Prop({ required: true }) readonly mosaicId: string;
    public fileBlob: string = '';
    public fileType: string = '';
    public showTokenDetails: boolean = false;

    // transferMosaic(mosaicId: string) {
    //     alert('Mosaic to transfer: ' + mosaicId);
    //     console.log(this);
    // }
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
