/*
 * Copyright 2020 NEM (https://nem.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 *
 */
import {
    Address,
    AliasAction,
    AliasTransaction,
    KeyGenerator,
    Mosaic,
    MosaicDefinitionTransaction,
    MosaicFlags,
    MosaicId,
    MosaicMetadataTransaction,
    MosaicNonce,
    MosaicSupplyChangeAction,
    MosaicSupplyChangeTransaction,
    NamespaceId,
    NamespaceRegistrationTransaction,
    NamespaceRegistrationType,
    PlainMessage,
    Transaction,
    TransferTransaction,
    UInt64,
} from 'symbol-sdk';
// @ts-ignore
import ErrorTooltip from '@/components/ErrorTooltip/ErrorTooltip.vue';
// @ts-ignore
import FormWrapper from '@/components/FormWrapper/FormWrapper.vue';
// @ts-ignore
import FormRow from '@/components/FormRow/FormRow.vue';
// @ts-ignore
import MaxFeeAndSubmit from '@/components/MaxFeeAndSubmit/MaxFeeAndSubmit.vue';
// @ts-ignore
import MaxFeeSelector from '@/components/MaxFeeSelector/MaxFeeSelector.vue';
// @ts-ignore
import MosaicSelector from '@/components/MosaicSelector/MosaicSelector.vue';
// @ts-ignore
import NamespaceSelector from '@/components/NamespaceSelector/NamespaceSelector.vue';
// @ts-ignore
import SignerSelector from '@/components/SignerSelector/SignerSelector.vue';
// @ts-ignore
import { ValidationRuleset } from '@/core/validation/ValidationRuleset';

// @ts-ignore
import NamespaceNameInput from '@/components/NamespaceNameInput/NamespaceNameInput';

// @ts-ignore
import ModalTransactionConfirmation from '@/views/modals/ModalTransactionConfirmation/ModalTransactionConfirmation';

import { FormTransactionBase } from '@/views/forms/FormTransactionBase/FormTransactionBase';

// child components
import { ValidationObserver, ValidationProvider } from 'vee-validate';
import { Component } from 'vue-property-decorator';
import { mapGetters } from 'vuex';
import { NamespaceModel } from '@/core/database/entities/NamespaceModel';
import { FilterHelpers } from '@/core/utils/FilterHelpers';
// @ts-ignore
import AssetFormPageWrap from '@/views/pages/assets/AssetFeeWrap/AssetFeeWrap.vue';
import { MarketplaceConfig } from '@/config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient(MarketplaceConfig.ipfsNode);
@Component({
    components: {
        AssetFormPageWrap,
        ValidationObserver,
        ValidationProvider,
        ErrorTooltip,
        MaxFeeSelector,
        MosaicSelector,
        NamespaceSelector,
        NamespaceNameInput,
        MaxFeeAndSubmit,
        FormWrapper,
        FormRow,
        ModalTransactionConfirmation,
        SignerSelector,
    },
    computed: {
        ...mapGetters({
            knownAccounts: 'account/knownAccounts',
            ownedMosaics: 'mosaic/ownedMosaics',
            ownedNamespaces: 'namespace/ownedNamespaces',
            repositoryFactory: 'network/repositoryFactory',
            metadataTransactions: 'metadata/transactions',
            currentAccountAddress: 'account/currentAccountAddress',
            serviceAddress: 'marketplace/serviceAddress',
        }),
    },
})
export class FormNFTMosaicCreationTs extends FormTransactionBase {
    /**
     * Repository factory for metadata transaction service
     */
    public validationRules = ValidationRuleset;
    /**
     * Current account owned mosaics
     * @protected
     * @type {MosaicModel[]}
     */
    public ownedNamespaces: NamespaceModel[];
    private currentAccountAddress: Address;
    private serviceAddress: Address;
    public formItems = {
        signerAddress: '',
        maxFee: 0,
        rootNamespace: '',
        subNamespace: '',
        registrationType: NamespaceRegistrationType.SubNamespace,
        description: '',
        nftFile: '',
    };
    showError: boolean = false;

    /**
     * Uploaded file name
     */
    fileData: { name: string; type: string; blob: string } = { name: '', type: '', blob: '' };

    protected get fertileNamespaces(): NamespaceModel[] {
        const maxNamespaceDepth = this.networkConfiguration.maxNamespaceDepth;
        return this.ownedNamespaces.filter(({ depth }) => depth < maxNamespaceDepth);
    }

    setParentNamespaceName(val) {
        this.formItems.rootNamespace = val;
    }
    public stripTagsNamespaceName() {
        this.formItems.subNamespace = FilterHelpers.stripFilter(this.formItems.subNamespace);
    }

    /**
     * Reset the form with properties
     * @return {void}
     */
    protected resetForm() {
        this.formItems.signerAddress = this.selectedSigner ? this.selectedSigner.address.plain() : this.currentAccount.address;

        this.formItems.rootNamespace = '';
        this.formItems.subNamespace = '';
        this.formItems.description = '';
        this.formItems.nftFile = '';
        this.fileData = { name: '', type: '', blob: '' };

        // - maxFee must be absolute
        this.formItems.maxFee = this.defaultFee;
    }
    protected async onBeforeUpload(file): Promise<void> {
        const ipfsHash = await ipfs.add(file);
        this.fileData = { name: file.name, blob: URL.createObjectURL(file), type: file.type };
        this.formItems.nftFile = ipfsHash.path;
    }
    protected formatNFTInfo(CID: string): { title: string; CID: string; description: string } {
        return {
            title: this.formItems.subNamespace,
            description: this.formItems.description,
            CID,
        };
    }
    protected getTransactions(): Transaction[] {
        const nonce = MosaicNonce.createRandom();
        const mosaicId = MosaicId.createFromNonce(nonce, this.currentAccountAddress);
        const namespaceId = new NamespaceId(`${this.formItems.rootNamespace}.${this.formItems.subNamespace}`);
        const nftInfo = JSON.stringify(this.formatNFTInfo(this.formItems.nftFile));
        return [
            this.createTransferServiceFeeTx(),
            this.createSubNamespaceRegistrationTx(),
            this.createNFTMosaicTx({ nonce, mosaicId }),
            this.createMintNFTMosaicTx({ mosaicId }),
            this.createMetaDataForNFTMosaicTx({ mosaicId, nftInfo }),
            this.createLinkAliasForNFTMosaicTx({ mosaicId, namespaceId }),
        ];
    }

    private createTransferServiceFeeTx(): Transaction {
        const maxFee = UInt64.fromUint(this.formItems.maxFee);
        return TransferTransaction.create(
            this.createDeadline(),
            this.serviceAddress,
            [new Mosaic(this.networkMosaic, UInt64.fromUint(this.formItems.maxFee * 10))],
            PlainMessage.create('Marketplace service fee'),
            this.networkType,
            maxFee,
        );
    }

    private createSubNamespaceRegistrationTx(): Transaction {
        const maxFee = UInt64.fromUint(this.formItems.maxFee);
        return NamespaceRegistrationTransaction.createSubNamespace(
            this.createDeadline(),
            this.formItems.subNamespace,
            this.formItems.rootNamespace,
            this.networkType,
            maxFee,
        );
    }

    private createNFTMosaicTx(tx: { nonce: MosaicNonce; mosaicId: MosaicId }): Transaction {
        const maxFee = UInt64.fromUint(this.formItems.maxFee);
        return MosaicDefinitionTransaction.create(
            this.createDeadline(),
            tx.nonce,
            tx.mosaicId,
            MosaicFlags.create(false, true, true),
            0,
            UInt64.fromUint(0),
            this.networkType,
            maxFee,
        );
    }

    private createMintNFTMosaicTx(tx: { mosaicId: MosaicId }): Transaction {
        const maxFee = UInt64.fromUint(this.formItems.maxFee);
        return MosaicSupplyChangeTransaction.create(
            this.createDeadline(),
            tx.mosaicId,
            MosaicSupplyChangeAction.Increase,
            UInt64.fromUint(1),
            this.networkType,
            maxFee,
        );
    }

    private createMetaDataForNFTMosaicTx(tx: { mosaicId: MosaicId; nftInfo: string }): Transaction {
        const maxFee = UInt64.fromUint(this.formItems.maxFee);
        return MosaicMetadataTransaction.create(
            this.createDeadline(),
            this.currentSignerAddress,
            KeyGenerator.generateUInt64Key('NFT'),
            tx.mosaicId,
            tx.nftInfo.length,
            tx.nftInfo,
            this.networkType,
            maxFee,
        );
    }

    private createLinkAliasForNFTMosaicTx(tx: { mosaicId: MosaicId; namespaceId: NamespaceId }): Transaction {
        const maxFee = UInt64.fromUint(this.formItems.maxFee);
        return AliasTransaction.createForMosaic(
            this.createDeadline(),
            AliasAction.Link,
            tx.namespaceId,
            tx.mosaicId,
            this.networkType,
            maxFee,
        );
    }

    /**
     * @override
     * @see {FormTransactionBase}
     */
    public async onSubmit() {
        await this.persistFormState();

        // - open signature modal
        this.command = this.createTransactionCommand();
        this.onShowConfirmationModal();
    }

    private async persistFormState() {
        const createMosaicForm: {
            rootNamespace: string;
            subNamespace: string;
            title: string;
            nftFile: any;
            maxFee: number;
        } = {
            rootNamespace: this.formItems.rootNamespace,
            subNamespace: this.formItems.subNamespace,
            title: this.formItems.subNamespace,
            nftFile: this.formItems.nftFile,
            maxFee: this.formItems.maxFee,
        };

        await this.$store.dispatch('marketplace/SET_ADD_TOKEN_FORM_STATE', createMosaicForm);
    }

    /**
     * Whether form has any changes
     * @readonly
     * @return {boolean}
     */
    public get hasFormAnyChanges(): boolean {
        return (
            this.formItems.signerAddress.length > 0 ||
            this.formItems.rootNamespace.length > 0 ||
            this.formItems.subNamespace.length > 0 ||
            this.formItems.nftFile.length > 0 ||
            this.fileData.name.length > 0 ||
            this.formItems.description.length > 0
        );
    }

    mounted() {
        this.formItems.signerAddress = this.currentSignerAddress.plain();
    }
}
