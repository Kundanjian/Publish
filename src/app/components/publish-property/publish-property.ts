import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PropertyApiService } from '../../core/services/property-api.service';

type AddOn = { name: string; charge: number; image?: string };

@Component({
  selector: 'app-publish-property',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './publish-property.html',
  styleUrls: ['./publish-property.css']
})
export class PublishPropertyComponent {
  private readonly propertyApi = inject(PropertyApiService);
  private readonly maxPropertyImages = 8;
  private readonly maxUploadImageSizeBytes = 5 * 1024 * 1024;
  private readonly targetImageSizeBytes = 650 * 1024;
  private readonly maxImageDimension = 1400;

  readonly facilityOptions = ['Bed', 'Fan', 'Chair', 'Table', 'AC', 'Water filter', 'Wardrobe'];
  readonly addOnOptions = [
    { name: 'Bed', charge: 500 },
    { name: 'AC', charge: 1500 },
    { name: 'Water filter', charge: 300 },
    { name: 'Food service', charge: 2500 }
  ];
  readonly foodOptions = ['Breakfast', 'Lunch', 'Dinner'];
  currentStep = 1;
  property = {
    title: '',
    location: 'Jabalpur, Madhya Pradesh',
    propertyType: 'Apartment',
    price: 12000,
    dailyPrice: 900,
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    summary: '',
    images: [] as string[],
    specifications: ['Fan'],
    addOns: [] as AddOn[],
    nearbyLandmark: '',
    landmarkDistance: '',
    foodAvailable: false,
    foodOptions: [] as string[],
    entryRule: '24 hour entry allowed'
  };
  isSubmitting = false;
  isSubmitted = false;
  successMessage = '';
  errorMessage = '';
  imageError = '';

  goToSpecifications(form: NgForm): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (form.invalid) {
      form.form.markAllAsTouched();
      this.errorMessage = 'Please correct the highlighted basic details before continuing.';
      return;
    }

    this.currentStep = 2;
  }

  goToBasics(): void {
    this.currentStep = 1;
  }

  toggleSpecification(name: string, checked: boolean): void {
    this.property.specifications = checked
      ? [...this.property.specifications, name]
      : this.property.specifications.filter((item) => item !== name);
  }

  toggleAddOn(name: string, checked: boolean, defaultCharge: number): void {
    this.property.addOns = checked
      ? [...this.property.addOns, { name, charge: defaultCharge }]
      : this.property.addOns.filter((item) => item.name !== name);
  }

  updateAddOnCharge(name: string, charge: number): void {
    this.property.addOns = this.property.addOns.map((item) =>
      item.name === name ? { ...item, charge: Number(charge) || 0 } : item
    );
  }

  async addPropertyImages(files: FileList | null): Promise<void> {
    this.imageError = '';
    if (!files?.length) {
      return;
    }

    const availableSlots = this.maxPropertyImages - this.property.images.length;
    const selectedFiles = Array.from(files).slice(0, Math.max(availableSlots, 0));

    if (files.length > availableSlots) {
      this.imageError = `You can upload maximum ${this.maxPropertyImages} property images.`;
    }

    const images = await this.readValidImages(selectedFiles);
    this.property.images = [...this.property.images, ...images].slice(0, this.maxPropertyImages);
  }

  removePropertyImage(index: number): void {
    this.property.images = this.property.images.filter((_, imageIndex) => imageIndex !== index);
  }

  async addAddOnImage(name: string, files: FileList | null): Promise<void> {
    this.imageError = '';
    const file = files?.[0];
    if (!file) {
      return;
    }

    const [image] = await this.readValidImages([file]);
    if (!image) {
      return;
    }

    this.property.addOns = this.property.addOns.map((item) =>
      item.name === name ? { ...item, image } : item
    );
  }

  removeAddOnImage(name: string): void {
    this.property.addOns = this.property.addOns.map((item) => {
      if (item.name !== name) {
        return item;
      }

      const { image, ...rest } = item;
      return rest;
    });
  }

  toggleFoodOption(name: string, checked: boolean): void {
    this.property.foodOptions = checked
      ? [...this.property.foodOptions, name]
      : this.property.foodOptions.filter((item) => item !== name);
  }

  hasSpecification(name: string): boolean {
    return this.property.specifications.includes(name);
  }

  selectedAddOn(name: string): AddOn | undefined {
    return this.property.addOns.find((item) => item.name === name);
  }

  hasFoodOption(name: string): boolean {
    return this.property.foodOptions.includes(name);
  }

  submitProperty(form: NgForm): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.isSubmitted = false;

    if (form.invalid) {
      form.form.markAllAsTouched();
      this.errorMessage = 'Please correct the highlighted fields.';
      return;
    }

    this.isSubmitting = true;

    this.propertyApi.publishProperty(this.property).subscribe({
      next: ({ message, property }) => {
        this.successMessage = `${message}. Listing ID: ${property.id}. It is now visible first in rental listings.`;
        this.isSubmitting = false;
        this.isSubmitted = true;
      },
      error: (error) => {
        this.errorMessage =
          error?.status === 401
            ? 'Please login before publishing a property.'
            : error?.name === 'TimeoutError'
              ? 'The server is taking too long. Please try again; the button has been reset.'
              : error?.error?.message || 'Unable to submit property.';
        this.isSubmitting = false;
        this.isSubmitted = false;
      }
    });
  }

  private async readValidImages(files: File[]): Promise<string[]> {
    const validFiles = files.filter((file) => {
      const valid = file.type.startsWith('image/') && file.size <= this.maxUploadImageSizeBytes;
      if (!valid) {
        this.imageError = 'Images must be image files and each selected image must be 5MB or smaller.';
      }
      return valid;
    });

    const images = await Promise.all(validFiles.map((file) => this.compressImage(file)));
    return images.filter((image): image is string => Boolean(image));
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private async compressImage(file: File): Promise<string> {
    const source = await this.readFileAsDataUrl(file);
    const image = await this.loadImage(source);
    const scale = Math.min(1, this.maxImageDimension / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      return source;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.82, 0.72, 0.62, 0.52]) {
      const compressed = canvas.toDataURL('image/jpeg', quality);
      if (this.estimateDataUrlBytes(compressed) <= this.targetImageSizeBytes || quality === 0.52) {
        return compressed;
      }
    }

    return source;
  }

  private loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to read selected image.'));
      image.src = source;
    });
  }

  private estimateDataUrlBytes(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1] || '';
    return Math.ceil((base64.length * 3) / 4);
  }
}
