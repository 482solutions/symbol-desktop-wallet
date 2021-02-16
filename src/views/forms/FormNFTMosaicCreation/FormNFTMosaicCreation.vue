<template>
    <div class="update-metadata-modal-conatiner">
        <div class="modal-header">
            <div class="modal-title">Create NFT Mosaic</div>
            <AssetFormPageWrap />
        </div>
        <FormWrapper>
            <ValidationObserver v-slot="{ handleSubmit }" ref="observer" slim>
                <form autocomplete="off" onsubmit="event.preventDefault()" class="mt-3">
                    <div class="create-nft-mosaic-form">
                        <div class="create-nft-mosaic-left">
                            <FormRow>
                                <template v-slot:label> {{ $t('form_label_by_account') }}: </template>
                                <template v-slot:inputs>
                                    <div class="select-container">
                                        <SignerSelector
                                            v-model="formItems.signerAddress"
                                            :signers="signers"
                                            :no-label="true"
                                            @input="onChangeSigner"
                                        />
                                    </div>
                                </template>
                            </FormRow>
                            <NamespaceSelector
                                :value="formItems.rootNamespace"
                                label="Root namespace"
                                :namespaces="fertileNamespaces"
                                :root-namespace="true"
                                @input="setParentNamespaceName"
                            />
                            <FormRow>
                                <template v-slot:label> NFT Title: </template>
                                <template v-slot:inputs>
                                    <ValidationProvider
                                        v-slot="{ errors }"
                                        vid="form_label_child_namespace_name"
                                        :name="$t('form_label_namespace_name')"
                                        :rules="{
                                            required: true,
                                            regex: '^[a-z0-9]{1}[a-z0-9-_]{0,40}$',
                                        }"
                                        tag="div"
                                        class="inputs-container"
                                    >
                                        <ErrorTooltip :errors="errors">
                                            <input
                                                v-model="formItems.subNamespace"
                                                v-focus
                                                class="input-size input-style"
                                                placeholder="Title of NFT Mosaic"
                                                type="text"
                                            />
                                        </ErrorTooltip>
                                    </ValidationProvider>
                                </template>
                            </FormRow>
                            <FormRow>
                                <template v-slot:label>NFT Description: </template>
                                <template v-slot:inputs>
                                    <ValidationProvider
                                        v-slot="{ errors }"
                                        vid="description"
                                        name="NFT description"
                                        rules="required|max:100"
                                        tag="div"
                                        class="inputs-container"
                                    >
                                        <ErrorTooltip :errors="errors">
                                            <input
                                                v-model="formItems.description"
                                                class="input-size input-style"
                                                placeholder="Description of NFT Mosaic"
                                                type="text"
                                            />
                                        </ErrorTooltip>
                                    </ValidationProvider>
                                </template>
                            </FormRow>
                        </div>
                        <div class="upload-qrcode-container">
                            <div class="upload-qrcode-left-pane">
                                <Upload
                                    v-model="fileName"
                                    :multiple="false"
                                    action="no action"
                                    type="drag"
                                    accept=".jpg,.jpeg,.png,.gif,.svg,.mp4,.mpeg4"
                                    :before-upload="onBeforeUpload"
                                    :max-size="20000"
                                >
                                    <div>
                                        <div v-if="fileName" class="upload-qrcode-preview">
                                            <div>
                                                <span>{{ fileName }}</span>
                                            </div>
                                        </div>

                                        <Icon v-if="!fileName" type="ios-cloud-upload"></Icon>
                                        <p>
                                            Drag and Drop file to upload on a service.
                                        </p>
                                        <p>
                                            This file will be uploaded to the network and connected to your token. Available formats: .jpg,
                                            .png, .svg, .gif, .mp4, .mpeg4. Maximum size: 20MB.
                                        </p>
                                    </div>
                                </Upload>
                            </div>
                        </div>
                    </div>
                    <MaxFeeAndSubmit
                        v-model="formItems.maxFee"
                        :disable-submit="!hasFormAnyChanges"
                        @button-clicked="handleSubmit(onSubmit)"
                    />
                </form>
            </ValidationObserver>
        </FormWrapper>
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
import { FormNFTMosaicCreationTs } from './FormNFTMosaicCreationTs';
export default class FormNFTMosaicCreation extends FormNFTMosaicCreationTs {}
</script>

<style lang="less" scoped>
@import './FormNFTMosaicCreation.less';
</style>
