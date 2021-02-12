// configuration
import { MarketplaceConfig } from '@/config';
import { MetadataType, MosaicId, MosaicInfo, RepositoryFactory } from 'symbol-sdk';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MetadataModel } from '@/core/database/entities/MetadataModel';

/// region protected helpers
/**
 * Request external feed data
 * @internal
 * @return {Promise<string>}
 */
const request = async (): Promise<string> => {
    const url = `${MarketplaceConfig.marketplaceServer}tokens`;
    return await fetch(url, {
        method: 'GET',
    }).then((response) => {
        return response.text();
    });
};
interface MosaicAdditionalData {
    price: number;
    endDate: number;
    holder: string;
    hours: number;
}
/// end-region protected helpers
export interface MosaicMarketplace extends MosaicInfo, MosaicAdditionalData {
    metadataList: MetadataModel[];
}
export class MarketplaceService {
    /**
     * Get all tokens from marketplace
     * @return {Promise<MosaicMarketplace[]}
     */
    public async getAllTokens(repositoryFactory: RepositoryFactory): Promise<Observable<MosaicMarketplace[]>> {
        const dataStr = await request();
        const dataJson = JSON.parse(dataStr);

        const mosaicIds: MosaicId[] = dataJson.map(({ id }) => new MosaicId(id));
        const mosaicMarketplaceInfo: MosaicMarketplace[] = [];
        repositoryFactory
            .createMosaicRepository()
            .getMosaics(mosaicIds)
            .subscribe((mosaicInfo: MosaicMarketplace[]) => {
                mosaicInfo.map((mosaic: MosaicMarketplace) => {
                    mosaic.metadataList = [];
                    const additionalData = this.getMosaicDataById(dataJson, mosaic.id.toHex());
                    mosaic.price = additionalData.price;
                    mosaic.endDate = additionalData.date;
                    mosaic.holder = additionalData.holder;
                    mosaic.hours = additionalData.hours;
                    repositoryFactory
                        .createMetadataRepository()
                        .search({ targetId: mosaic.id, metadataType: MetadataType.Mosaic })
                        .pipe(map((metadataListPage) => metadataListPage.data.map((metadata) => new MetadataModel(metadata))))
                        .subscribe((t) => {
                            t.map((value) => {
                                if (!mosaic.metadataList.find((o) => o.metadataId === value.metadataId)) {
                                    mosaic.metadataList.push(value);
                                }
                            });
                            mosaicMarketplaceInfo.push(mosaic);
                        });
                });
            });

        return from([mosaicMarketplaceInfo]);
    }
    private getMosaicDataById(
        data: { id: string; price: number; date: number; holder: string; hours: number }[],
        id: string,
    ): { id: string; price: number; date: number; holder: string; hours: number } {
        return data.find((o) => o.id === id);
    }
}
