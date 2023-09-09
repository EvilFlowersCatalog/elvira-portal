import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AcquisitionDetail, UserAcquisition, UserAcquisitionData, UserAcquisitionShare } from '../types/acquisition.types';

@Injectable({
  providedIn: 'root',
})
export class AcquisitionService {
  constructor(
    private readonly httpClient: HttpClient
  ) { }

  /**
   * @param acquisition_id String, id of acquisition
   * @returns Detail of given acquisition
   */
  acquisitionDetail(acquisition_id: string): Observable<AcquisitionDetail> {
    return this.httpClient.get<AcquisitionDetail>(
      environment.baseUrl + `/api/v1/acquisitions/${acquisition_id}`
    );
  }

  /**
   * @param user_acquisition UserAcquisition type, ...
   * @returns Answer
   */
  createUserAcquisition(user_acquisition: UserAcquisition | UserAcquisitionShare) {
    return this.httpClient.post(
      environment.baseUrl + `/api/v1/user-acquisitions`,
      user_acquisition
    )
  }

  /**
   * 
   * @param user_acquisition_id String, if of acquisition
   * @param format String, type of what we want, forexample 'base64'
   * @returns File
   */
  getUserAcquisition(user_acquisition_id: string, format: string = '') {
    return this.httpClient.get<UserAcquisitionData>(
      environment.baseUrl + `/data/v1/user-acquisitions/${user_acquisition_id}`,
      {
        params: {
          format: format
        }
      }
    )
  }
}
