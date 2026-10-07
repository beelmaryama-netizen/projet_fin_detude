import { Injectable } from '@nestjs/common';

@Injectable()
export class CatalogService {
  list() {
    return [
      { id: 'RESIDENTIAL', name: 'Résidentiel', enabled: true },
      { id: 'COMMERCIAL', name: 'Commercial', enabled: true },
      { id: 'INDUSTRIAL', name: 'Industriel', enabled: true },
      { id: 'MEDICAL', name: 'Médical / Clinique', enabled: true },
    ];
  }
}
