import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('services')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  list() {
    return this.catalogService.list();
  }
}
