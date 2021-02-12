<template>
    <div class="update-metadata-modal-conatiner">
        <div class="modal-header">
            <div class="modal-title">Sell NFT Mosaic</div>
            <AssetFormPageWrap />
        </div>
        <FormWrapper>
            <ValidationObserver v-slot="{ handleSubmit }" ref="observer" slim>
                <form autocomplete="off" onsubmit="event.preventDefault()" class="create-nft-mosaic-form mt-3">
                    <div class="create-nft-mosaic-left">
                        <FormRow>
                            <template v-slot:label>Price(XYM)</template>
                            <template v-slot:inputs>
                                <ValidationProvider
                                    v-slot="{ errors }"
                                    vid="price"
                                    name="Price"
                                    rules="required|min_value:10"
                                    tag="div"
                                    class="inputs-container"
                                >
                                    <ErrorTooltip :errors="errors">
                                        <input
                                            v-model="formItems.price"
                                            class="input-size input-style"
                                            placeholder="XYM"
                                            type="text"
                                            @input="calculateFee()"
                                        />
                                    </ErrorTooltip>
                                </ValidationProvider>
                            </template>
                        </FormRow>
                        <FormRow>
                            <template v-slot:label>Service Fee(XYM)</template>
                            <template v-slot:inputs>
                                <input
                                    v-model="formItems.serviceFee"
                                    class="input-size input-style"
                                    placeholder="XYM"
                                    type="text"
                                    disabled
                                />
                            </template>
                        </FormRow>
                        <FormRow>
                            <template v-slot:label>Creator Fee 5% (XYM)</template>
                            <template v-slot:inputs>
                                <input
                                    v-model="formItems.creatorFee"
                                    class="input-size input-style"
                                    placeholder="XYM"
                                    type="text"
                                    disabled
                                />
                            </template>
                        </FormRow>
                        <FormRow>
                            <template v-slot:label>Sell for</template>
                            <template v-slot:inputs>
                                <Select
                                    v-model="formItems.sellTime"
                                    placeholder="hours"
                                    class="select-size select-style"
                                    @input="calculateFee()"
                                >
                                    <Option v-for="{ value, label } in hoursList" :key="value" :value="value">
                                        {{ label }}
                                    </Option>
                                </Select>
                            </template>
                        </FormRow>
                        <FormRow>
                            <template v-slot:label>You'll Receive:</template>
                            <template v-slot:inputs>
                                <input
                                    v-model="formItems.totalReceive"
                                    class="input-size input-style"
                                    placeholder="XYM"
                                    type="text"
                                    disabled
                                />
                            </template>
                        </FormRow>
                        <FormRow>
                            <template v-slot:label> {{ $t('fee') }}: </template>
                            <template v-slot:inputs>
                                <MaxFeeSelector
                                    v-model="formItems.maxFee"
                                    calculated-recommended-fee="0"
                                    calculated-highest-fee="0"
                                    @on-change="calculateFee()"
                                />
                            </template>
                        </FormRow>
                        <FormRow>
                            <template v-slot:inputs>
                                <button
                                    class="button-style inverted-button fat-button"
                                    style="cursor: pointer; margin-top: 2em;"
                                    :disabled="!hasFormAnyChanges"
                                    @click="handleSubmit(sellMosaic)"
                                >
                                    {{ $t('send') }}
                                </button>
                            </template>
                        </FormRow>
                    </div>
                    <div class="modal-nft-file">
                        <Spin v-if="!fileBlob || !fileType" size="large" />
                        <img v-if="fileType && fileType.indexOf('image') !== -1" :src="fileBlob" class="card-image" />
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
                </form>
            </ValidationObserver>
        </FormWrapper>
    </div>
</template>

<script lang="ts">
import { FormNFTMosaicSellTs } from './FormNFTMosaicSellTs';
export default class FormNFTMosaicSell extends FormNFTMosaicSellTs {}
</script>

<style lang="less" scoped>
@import './FormNFTMosaicSell.less';
</style>
