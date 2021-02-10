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
import Vue from 'vue';
// internal dependencies
import { AwaitLock } from './AwaitLock';
import { MarketplaceService, MosaicMarketplace } from '@/services/MarketplaceService';
import { Address, MetadataType, MosaicId, RepositoryFactory } from 'symbol-sdk';
import { MetadataModel } from '@/core/database/entities/MetadataModel';
import { NetworkCurrencyModel } from '@/core/database/entities/NetworkCurrencyModel';
import { map } from 'rxjs/operators';
import { MosaicModel } from '@/core/database/entities/MosaicModel';
import { MetadataService } from '@/services/MetadataService';

const Lock = AwaitLock.create();

export interface CreateMosaicFormState {
    rootNamespace: string;
    subNamespace: string;
    title: string;
    nftFile: any;
    maxFee: number;
}

interface MarketplaceState {
    initialized: boolean;
    mosaics: MosaicMarketplace[];
    isFetchingMarketplace: boolean;
    isFetchingMyCollection: boolean;
    serviceAddress: Address;
    createMosaicForm: CreateMosaicFormState;
    myCollection: MosaicMarketplace[];
}
const marketplaceState: MarketplaceState = {
    initialized: false,
    mosaics: [],
    isFetchingMarketplace: false,
    isFetchingMyCollection: false,
    serviceAddress: Address.createFromRawAddress('TBQRYGBRTOIIOVQQQENMCTL2RLW2DV3UPQ3RG3I'),
    myCollection: [],
    createMosaicForm: {
        rootNamespace: '',
        subNamespace: '',
        title: '',
        nftFile: null,
        maxFee: 0,
    },
};
/**
 * Community Store
 */
export default {
    namespaced: true,
    state: marketplaceState,
    getters: {
        getInitialized: (state: MarketplaceState) => state.initialized,
        isFetchingMarketplace: (state: MarketplaceState) => state.isFetchingMarketplace,
        isFetchingMyCollection: (state: MarketplaceState) => state.isFetchingMyCollection,
        allTokens: (state: MarketplaceState) => state.mosaics,
        myCollection: (state: MarketplaceState) => state.myCollection,
        serviceAddress: (state: MarketplaceState) => state.serviceAddress,
        createMosaicForm: (state: MarketplaceState) => state.createMosaicForm,
    },
    mutations: {
        setInitialized: (state: MarketplaceState, initialized) => {
            state.initialized = initialized;
        },
        addTokens: (state: MarketplaceState, mosaics: MosaicMarketplace[]): void => {
            Vue.set(state, 'mosaics', mosaics);
        },
        myCollection: (
            state: MarketplaceState,
            {
                mosaics,
                currentSignerAddress,
                mosaicMetadataList,
            }: {
                mosaics: MosaicModel[];
                currentSignerAddress: Address;
                networkCurrency: NetworkCurrencyModel;
                mosaicMetadataList: MetadataModel[];
            },
        ) => {
            const uniqueMosaics = mosaics.map((mosaic) => {
                mosaic.metadataList = MetadataService.getMosaicMetadataByTargetId(mosaicMetadataList, mosaic.mosaicIdHex);
                return mosaic;
            });

            const holdMosaics = uniqueMosaics
                .filter((m) => m.addressRawPlain === currentSignerAddress.plain())
                .sort((m1, m2) => {
                    const owner1 = m1.ownerRawPlain === currentSignerAddress.plain();
                    const owner2 = m2.ownerRawPlain === currentSignerAddress.plain();
                    return Number(owner1) - Number(owner2);
                });
            Vue.set(
                state,
                'myCollection',
                holdMosaics.filter((m) => m.ownerRawPlain === currentSignerAddress.plain() || m.balance > 0),
            );
        },
        isFetchingMarketplace: (state: MarketplaceState, isFetchingMarketplace: boolean) => {
            Vue.set(state, 'isFetchingMarketplace', isFetchingMarketplace);
        },
        isFetchingMyCollection: (state: MarketplaceState, isFetchingMyCollection: boolean) => {
            Vue.set(state, 'isFetchingMyCollection', isFetchingMyCollection);
        },
        createMosaicForm: (state: MarketplaceState, createMosaicForm: CreateMosaicFormState) => {
            Vue.set(state, 'createMosaicForm', createMosaicForm);
        },
    },
    actions: {
        async initialize({ commit, dispatch, getters }) {
            const callback = async () => {
                // fetch tokens
                await dispatch('FETCH_TOKENS');
                dispatch('LOAD_MY_COLLECTION');
                commit('setInitialized', true);
            };
            await Lock.initialize(callback, { getters });
        },
        async uninitialize({ commit, getters }) {
            const callback = async () => {
                commit('setInitialized', false);
            };
            await Lock.uninitialize(callback, { getters });
        },
        /// region scoped actions
        async FETCH_TOKENS({ commit, rootGetters }) {
            const repositoryFactory: RepositoryFactory = rootGetters['network/repositoryFactory'];

            commit('isFetchingMarketplace', true);
            const marketplaceService = new MarketplaceService();
            const marketplace = await marketplaceService.getAllTokens(repositoryFactory);
            marketplace.subscribe((mosaics: MosaicMarketplace[]) => {
                setTimeout(() => {
                    commit('addTokens', mosaics);
                    commit('isFetchingMarketplace', false);
                }, 1000);
            });
        },
        LOAD_MY_COLLECTION({ commit, rootGetters }) {
            const repositoryFactory: RepositoryFactory = rootGetters['network/repositoryFactory'];
            const networkCurrency: NetworkCurrencyModel = rootGetters['mosaic/networkCurrency'];
            const mosaicMetadataList: MetadataModel[] = rootGetters['metadata/mosaicMetadataList'];
            const mosaics: MosaicModel[] = rootGetters['mosaic/holdMosaics'];

            commit('isFetchingMyCollection', true);

            mosaics.map((mosaic: MosaicModel) => {
                repositoryFactory
                    .createMetadataRepository()
                    .search({
                        targetId: new MosaicId(mosaic.mosaicIdHex),
                        metadataType: MetadataType.Mosaic,
                    })
                    .pipe(map((metadataListPage) => metadataListPage.data.map((metadata) => new MetadataModel(metadata))))
                    .subscribe((t) => {
                        t.map((value) => {
                            if (!mosaic.metadataList.find((o) => o.metadataId === value.metadataId)) {
                                mosaic.metadataList.push(value);
                            }
                        });
                        const currentSignerAddress: Address = rootGetters['account/currentSignerAddress'];
                        if (!currentSignerAddress) {
                            return;
                        }
                        commit('myCollection', {
                            mosaics: mosaics,
                            currentSignerAddress,
                            networkCurrency,
                            mosaicMetadataList,
                        });
                    })
                    .add(() => commit('isFetchingMyCollection', false));
            });
        },
        SIGNER_CHANGED({ dispatch, rootGetters }) {
            const currentSignerAddress: Address = rootGetters['account/currentSignerAddress'];
            if (!currentSignerAddress) {
                return;
            }
            dispatch('LOAD_MY_COLLECTION');
        },
        async SET_ADD_TOKEN_FORM_STATE({ commit }, createMosaicForm: CreateMosaicFormState) {
            commit('createMosaicForm', createMosaicForm);
        },
    },
};
