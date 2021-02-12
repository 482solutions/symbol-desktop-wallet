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

import NamespaceNameInput from '@/components/NamespaceNameInput/NamespaceNameInput.vue';

// @ts-ignore
import ModalTransactionConfirmation from '@/views/modals/ModalTransactionConfirmation/ModalTransactionConfirmation.vue';

import { FormTransactionBase } from '@/views/forms/FormTransactionBase/FormTransactionBase';

// child components
import { ValidationObserver, ValidationProvider } from 'vee-validate';
import { Component, Prop } from 'vue-property-decorator';
import { mapGetters } from 'vuex';
import { NamespaceModel } from '@/core/database/entities/NamespaceModel';
import { MarketplaceConfig } from '@/config';
import { Address } from 'symbol-sdk';
import { NotificationType } from '@/core/utils/NotificationType';
@Component({
    components: {
        ValidationObserver,
        ValidationProvider,
        ErrorTooltip,
        MaxFeeSelector,
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
export class FormNFTMosaicSellTs extends FormTransactionBase {
    @Prop({
        required: true,
    })
    mosaicId: string;
    @Prop({
        required: true,
    })
    fileType: string;
    @Prop({
        required: true,
    })
    fileBlob: string;
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
    public formItems = {
        maxFee: 0,
        price: 0,
        serviceFee: 0,
        creatorFee: 0,
        sellTime: 6,
        totalReceive: 0,
    };
    showError: boolean = false;
    public hoursList: { label: string; value: number }[];
    /**
     * Uploaded file name
     */
    fileName = '';
    public async created() {
        this.hoursList = MarketplaceConfig.hoursList.map((item: number) => ({
            label: FormNFTMosaicSellTs.getLabel(item),
            value: item,
        }));
        this.$store.dispatch('network/LOAD_TRANSACTION_FEES');
        this.resetForm();
        this.calculateFee();
    }
    public calculateFee() {
        this.calculateServiceFee();
        this.calculateCreatorFee();
        this.calculateTotalReceive();
    }
    private calculateServiceFee() {
        const timeFactor = {
            6: 0,
            12: 2,
            24: 3,
            48: 4,
        };
        this.formItems.serviceFee =
            this.formItems.price * 0.025 + timeFactor[this.formItems.sellTime] * (this.formItems.maxFee / Math.pow(10, 6));
    }
    private calculateCreatorFee() {
        this.formItems.creatorFee = this.formItems.price * 0.05;
    }
    private calculateTotalReceive() {
        this.formItems.totalReceive = this.formItems.price - this.formItems.creatorFee - this.formItems.serviceFee;
    }
    private static getLabel(value: number) {
        return `${value} hours`;
    }
    /**
     * Reset the form with properties
     * @return {void}
     */
    protected resetForm() {
        this.formItems.price = 0;
        this.formItems.serviceFee = 0;
        this.formItems.creatorFee = 0;
        this.formItems.sellTime = 12;
        // - maxFee must be absolute
        this.formItems.maxFee = this.defaultFee;
    }

    /**
     * Whether form has any changes
     * @readonly
     * @return {boolean}
     */
    public get hasFormAnyChanges(): boolean {
        return this.formItems.price > 0 || this.formItems.serviceFee > 0 || this.formItems.sellTime > 0;
    }
    private async addTokenToMarketRequest(data: { id: string; holder: string; date: number; price: number }): Promise<void> {
        const url = `${MarketplaceConfig.marketplaceServer}tokens`;
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (response.status === 201) {
            this.$store.dispatch('notification/ADD_SUCCESS', NotificationType.NFT_MOSAIC_ADDED_TO_MARKETPLACE);
        } else {
            this.$store.dispatch('notification/ADD_WARNING', 'NFT Token has been already added to the marketplace.');
        }
        this.onConfirmationSuccess();
    }
    public async sellMosaic() {
        const requestData = {
            id: this.mosaicId,
            holder: this.currentAccountAddress.plain(),
            date: this.formItems.sellTime,
            price: Number(this.formItems.price) * Math.pow(10, 6),
        };
        await this.addTokenToMarketRequest(requestData);
    }
}
