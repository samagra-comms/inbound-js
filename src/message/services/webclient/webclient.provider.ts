import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";

@Injectable()
export class WebClientProvider {

    constructor(
        private readonly configService: ConfigService,
    ) {}

    getUciApiWebClient(
        headers?: Record<string, string>
    ): AxiosInstance {
        if (!headers) {
            headers = {};
        }
        headers['admin-token'] = this.configService.get<string>('UCI_API_TOKEN');
        return axios.create({
            baseURL: `${this.configService.get<string>('UCI_API_BASE_URL')}`,
            headers: headers,
        });
    }
}