<template v-slot="{ handleSubmit }">
    <div class="card-container card-marketplace">
        <div class="card-container-image">
            <img :src="'https://cloudflare-ipfs.com/ipfs/' + cid" :alt="title" :title="title" class="card-image" />
        </div>
        <div class="card-container-info">
            <a :href="'http://explorer.testnet.symboldev.network/mosaics/' + mosaicId" class="card-info-title" target="_blank">{{
                title
            }}</a>

            <div class="card-footer">
                <div>
                    <div class="card-info-time">Expires in: {{ currentTime }}</div>
                    <div class="card-info-time">XYM: {{ price / Math.pow(10, 6) }}</div>
                </div>
                <button class="button-style inverted-button fat-button" style="cursor: pointer;" type="submit" @click="buyMosaic(mosaicId)">
                    Buy
                </button>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class NFTCardMarketplace extends Vue {
    currentTime: string = null;
    @Prop({ required: true }) readonly title: string;
    @Prop({ required: true }) readonly cid: string;
    @Prop({ required: true }) readonly mosaicId: string;
    @Prop({ required: true }) readonly price: number;
    @Prop({ required: true }) readonly endDate: number;
    buyMosaic(mosaicId: string) {
        alert('Mosaic to buy: ' + mosaicId);
    }
    created() {
        this.currentTime = '00:00:00';
        setInterval(() => this.updateExpiresTime(), 1000);
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
