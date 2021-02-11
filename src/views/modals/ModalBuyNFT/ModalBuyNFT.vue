<template>
    <div class="buy_nft_modal">
        <Modal v-model="show" :title="$t('modal_title_buy_nft')" :transfer="false" @close="show = false">
            <div class="create-nft-mosaic-form">
                <div class="token-preview">
                    <div class="card-info-title">{{ title }}</div>
                    <img :src="imageLink" class="card-image" />
                </div>

                <div class="create-nft-mosaic-left">
                    <div class="card-info-creator">Creator: {{ (nftInfo.rootNamespace + " " + nftInfo.subNamespace) }}</div>
                    <div class="card-info-creator">Description: {{ nftInfo.nftFile }}</div>
                    <div class="card-info-time">Expires in: {{ time }}</div>
                    <div class="card-info-time">Total supply: {{ 1 }}</div>
                    <div class="card-info-time">XYM: {{ price }}</div>

                    <button
                        class="button-style inverted-button fat-button"
                        style="cursor: pointer; width: 50%;"
                        type="submit"
                        @click="hasConfirmationModal = true"
                    >
                        Buy
                    </button>
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
