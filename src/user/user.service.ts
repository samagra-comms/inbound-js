import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
    private configService: ConfigService;

    constructor(private readonly httpService: HttpService) {}

    private getHeaders() {
        return {
            headers: {
                'Authorization': this.configService.get<string>('FA_AUTH_KEY'),
                'Content-Type': 'application/json',
                'X-FusionAuth-Application-Id': this.configService.get<string>('FA_APP_ID')
            }
        };
    }

    private getBaseUrl() {
        return this.configService.get<string>('FA_URL');
    }

    getUserById(userId: string): Observable<AxiosResponse<any>> {
        const url = `${this.getBaseUrl()}/api/user/${userId}`;
        return this.httpService.get(url, this.getHeaders());
    }

    getUserByUsername(username: string): Observable<AxiosResponse<any>> {
        const url = `${this.getBaseUrl}api/user/search?queryString=username%3A${username}&exactMatch=true`
        return this.httpService.get(url, this.getHeaders());
    }

    createUser(userPayload: any): Observable<AxiosResponse<any>> {
        const url = `${this.getBaseUrl()}/api/user`;
        return this.httpService.post(url, userPayload, this.getHeaders());
    }
}
