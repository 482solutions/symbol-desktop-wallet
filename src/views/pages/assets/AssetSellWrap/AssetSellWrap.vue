<template>
    <div class="asset-form-main-container">
        <div class="form-section">
            <slot name="form-section" />
        </div>
        <Icon type="ios-help-circle-outline" size="20" @click="hasHelpModal = true" />
        <div class="container">
            <Modal v-model="hasHelpModal" :transfer="false" :title="$t('rules_describe')">
                <div class="asset-description-sub-title">
                    Price
                </div>
                <div class="asset-description-text">
                    Price for your token in marketplace
                </div>
                <div class="asset-description-sub-title">
                    Service Fee
                </div>
                <div class="asset-description-text">
                    Service commission is calculated by the formula: (Price/100*2.5) + Time transaction Fee.
                    <div>Time transaction Fee:</div>
                    <div>6 hours - Free</div>
                    <div>12 hours - 2*Fee</div>
                    <div>24 hours - 3*Fee</div>
                    <div>48 hours - 4*Fee</div>
                </div>
                <div class="asset-description-sub-title">
                    Creator Fee
                </div>
                <div class="asset-description-text">
                    First creator Fee - it's 5% from Price
                </div>
                <div class="asset-description-sub-title">
                    Sell For
                </div>
                <div class="asset-description-text">
                    Time for transaction
                </div>
                <div class="asset-description-sub-title">
                    You'll Receive
                </div>
                <div class="asset-description-text">
                    The amount you receive minus commissions
                </div>
                <div slot="footer" class="modal-footer"></div>
            </Modal>
        </div>
    </div>
</template>

<script lang="ts">
import { AssetSellWrapTs } from './AssetSellWrapTs';
export default class AssetFormPageWrap extends AssetSellWrapTs {}
</script>

<style lang="less" scoped>
@import './AssetSellWrap.less';
</style>
