<template>
    <div class="buy_nft_modal">
        <Modal v-model="show" :title="$t('modal_title_buy_nft')" :transfer="false" @close="show = false">
            <div class="create-nft-mosaic-form">
                <div class="token-preview">
                    <a :href="'http://explorer.testnet.symboldev.network/mosaics/' + mosaicId" class="token-link" target="_blank">{{
                        title
                    }}</a>
                    <Spin v-if="!fileBlob || !fileType" size="large" />
                    <img v-if="fileBlob && fileType && fileType.indexOf('image') !== -1" :src="fileBlob" class="card-image" />
                    <video
                        v-else-if="fileBlob && fileType && fileType.indexOf('video') !== -1"
                        autoplay
                        muted
                        loop
                        :src="fileBlob"
                        class="card-image"
                        :type="fileType"
                    />
                </div>

                <div v-if="sellerAccountAddress" class="create-nft-mosaic-left" style="padding-top: 20px;">
                    <div class="card-info-time">Seller: {{ sellerAccountAddress.plain() }}</div>
                    <div class="card-info-time">Description: {{ description }}</div>
                    <div class="card-info-time">Expires in: {{ time }}</div>
                    <div class="card-info-time">Total supply: {{ 1 }}</div>
                    <div class="card-info-time">XYM: {{ price }}</div>

                    <MaxFeeAndSubmit v-model="maxFee" submit-button-text="Buy now" additional-text="" @button-clicked="onSubmit" />
                    <span style="color: #a72391; margin-left: 190px; margin-top: 20%; width: 240px;">
                        The deal will be completed and the token will appear in your collection when the seller confirms the deal.
                    </span>
                </div>
            </div>

            <div slot="footer" class="modal-footer"></div>
        </Modal>
        <ModalTransactionConfirmation
            v-if="hasConfirmationModal"
            :command="command"
            :visible="hasConfirmationModal"
            @success="onConfirmationSuccess"
            @error="onConfirmationError"
            @close="onConfirmationCancel"
        />
    </div>
</template>

<script lang="ts">
import { ModalBuyNFTts } from './ModalBuyNFT';

export default class ModalBuyNFT extends ModalBuyNFTts {}
</script>
<style lang="less" scoped>
@import 'ModalBuyNFT.less';
</style>
