import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  boxForm!: FormGroup;
  isSubmitting = false;
  submitted = false;
  orderSuccess = false;
  minDate: string = '';
  loading = false;
  selectedSaladIndexes: number[] = [];
  touchedFields: { [key: string]: boolean } = {};

  // Box types with their details
  boxTypes = [
    {
      id: 'mini',
      name: 'Mini Box',
      image: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e',
      description: '4 Mixed Fruits Slices',
      prices: { trial: 69, weekly: 350, monthly: 1300 }
    },
    {
      id: 'classic',
      name: 'Classic Box',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e',
      description: '1 Vegetable, 3 Fruits, 1 Mixed Dry Fruits',
      prices: { trial: 100, weekly: 550, monthly: 2200 }
    },
    {
      id: 'standard',
      name: 'Standard Box',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      description: '2 Vegetables, 3 Fruits, 1 Mixed Dry Fruits, 1 Sprouts',
      prices: { trial: 129, weekly: 620, monthly: 2400 }
    },
    {
      id: 'premium',
      name: 'Premium Box',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061',
      description: '2 Vegetables, 4 Fruits, 2 Mixed Dry Fruits, 2 Sprouts',
      prices: { trial: 140, weekly: 700, monthly: 2600 }
    },
    {
      id: 'fitness',
      name: 'Fitness Box',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      description: '2 Dry Fruits, 3 Fruits, 2 Eggs, 2 Vegetables, 2 Sprouts, 1 Salad',
      prices: { trial: 200, weekly: 1000, monthly: 2999 }
    },
    {
      id: 'salad',
      name: 'Salad Box',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
      description: 'Mini Box - ₹70, Standard Box - ₹120, Premium Box - ₹180',
      prices: { trial: 70, weekly: 120, monthly: 180 }
    },
     {
      id: 'senior citizen',
      name: 'Senior Citizen Box',
      image: 'https://images.unsplash.com/photo-1547592180-85f173990554',
      description: '2 Fruits, 1 Vegetable,1 Lentils',
      prices: { trial: 59, weekly: 399, monthly: 1499 }
    },
      {
      id: 'children box',
      name: 'Childern Box',
      image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b',
      description: '3 Fruits, 2 Vegetable',
      prices: { trial: 59, weekly: 350, monthly: 1300 }
    }
  ];

  constructor(private fb: FormBuilder, private firestore: Firestore) {
    this.setMinDate();
    this.initializeForm();
    this.markAllAsUntouched();
  }

  onModalOpen() {
    this.boxForm.reset();
    this.boxes.clear();
    this.addBox();
    this.selectedSaladIndexes = [];
    this.submitted = false;
    this.orderSuccess = false;
    this.markAllAsUntouched();
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = tomorrow.toISOString().split('T')[0];
    
    this.boxForm.patchValue({
      orderDate: this.minDate
    });
  }

  initializeForm() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    this.boxForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      address: ['', [Validators.required]],
      boxes: this.fb.array([this.createBoxGroup()]),
      orderDate: [tomorrow.toISOString().substring(0, 10), Validators.required],
    });
  }

  markAllAsUntouched() {
    this.touchedFields = {
      name: false,
      phoneNumber: false,
      address: false,
      orderDate: false
    };

    for (let i = 0; i < this.boxes.length; i++) {
      this.touchedFields[`boxType-${i}`] = false;
      this.touchedFields[`subscription-${i}`] = false;
      this.touchedFields[`deliveryDate-${i}`] = false;
      this.touchedFields[`saladType-${i}`] = false;
    }
  }

  markAsTouched(fieldName: string) {
    this.touchedFields[fieldName] = true;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.getControlFromPath(fieldName);
    return this.touchedFields[fieldName] && control.invalid && (control.dirty || control.touched);
  }

  private getControlFromPath(path: string): AbstractControl {
    const parts = path.split('-');
    if (parts.length === 1) {
      return this.boxForm.get(path) as AbstractControl;
    } else {
      const [fieldName, index] = parts;
      const boxGroup = this.boxes.at(parseInt(index)) as FormGroup;
      return boxGroup.get(fieldName) as AbstractControl;
    }
  }

  get boxes(): FormArray {
    return this.boxForm.get('boxes') as FormArray;
  }

  createBoxGroup(): FormGroup {
    return this.fb.group({
      boxType: ['', Validators.required],
      saladType: [''],
      deliveryDate: ['', Validators.required],
      subscription: ['', Validators.required],
    }, { validators: this.saladTypeValidator });
  }

  private saladTypeValidator(group: FormGroup) {
    const boxType = group.get('boxType')?.value;
    const saladType = group.get('saladType')?.value;
    
    if (boxType === 'salad' && !saladType) {
      return { saladTypeRequired: true };
    }
    return null;
  }

  addBox(): void {
    const newIndex = this.boxes.length;
    this.boxes.push(this.createBoxGroup());
    
    this.touchedFields[`boxType-${newIndex}`] = false;
    this.touchedFields[`subscription-${newIndex}`] = false;
    this.touchedFields[`deliveryDate-${newIndex}`] = false;
    this.touchedFields[`saladType-${newIndex}`] = false;
  }

  removeBox(index: number): void {
    this.boxes.removeAt(index);
    this.selectedSaladIndexes = this.selectedSaladIndexes
      .filter(i => i !== index)
      .map(i => i > index ? i - 1 : i);
  }

  onBoxTypeChange(event: any, index: number) {
    this.markAsTouched(`boxType-${index}`);
    const selectedValue = event.target.value;
    
    if (selectedValue === 'salad') {
      if (!this.selectedSaladIndexes.includes(index)) {
        this.selectedSaladIndexes.push(index);
      }
    } else {
      this.selectedSaladIndexes = this.selectedSaladIndexes.filter(i => i !== index);
    }
    
    // Update saladType validation
    const boxGroup = this.boxes.at(index) as FormGroup;
    boxGroup.get('saladType')?.updateValueAndValidity();
  }

  async order() {
    this.submitted = true;
    this.loading = true;
    
    // Mark all fields as touched
    Object.keys(this.touchedFields).forEach(key => this.touchedFields[key] = true);
    
    // Trigger validation for all form controls
    this.validateAllFormFields(this.boxForm);
    
    if (this.boxForm.invalid) {
      this.loading = false;
      return;
    }
    const formData = this.boxForm.value; // Get form values
    let formDetailsHtml = "";

        for (const key in formData) {
      if (formData.hasOwnProperty(key)) {
        if (Array.isArray(formData[key])) {
          // If it's an array, format it properly
          formDetailsHtml += `<p><strong>${key}:</strong></p><ul>`;
          formData[key].forEach((item: any, index: any) => {
            formDetailsHtml += `<li>Box ${index + 1}: ${JSON.stringify(item, null, 2)}</li>`;
          });
          formDetailsHtml += `</ul>`;
        } else {
          formDetailsHtml += `<p><strong>${key}:</strong> ${formData[key]}</p>`;
        }
      }
    }
        const emailHtml = `
      <h1>Thank you for your order!</h1>
      <p>Order By: ${this.boxForm.value.name}, ${this.boxForm.value.phoneNumber}</p>
      ${formDetailsHtml} <!-- This will insert all form fields properly -->
      <p>We'll process your order shortly.</p>
    `;

    try {
      const usersRef = collection(this.firestore, 'orderDetails');
      console.log('Form Data:', this.boxForm.value);
      await addDoc(usersRef, this.boxForm.value);

      // 2. Send confirmation email via Cloud Function
    const emailResponse = await fetch(
      ' https://sendemail-u4qczdbovq-uc.a.run.app/sendEmail',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: "amhere535@gmail.com", // assuming you have email in form
          subject: 'Order Confirmation',
          text: `Thank you for your order! Order by: ${this.boxForm.value.name}, ${this.boxForm.value.phoneNumber}`,
          html: emailHtml
        })
      }
    );

    if (!emailResponse.ok) {
      throw new Error('Email sending failed');
    }
      this.orderSuccess = true;
    } catch (error) {
      console.error('Error adding document:', error);
      alert('There was an error submitting the form');
    } finally {
      this.loading = false;
    }
  }

  private validateAllFormFields(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.validateAllFormFields(control);
      } else {
        control?.markAsTouched();
        control?.updateValueAndValidity();
      }
    });
  }

  resetForm() {
    const minDate = this.minDate;
    this.boxForm.reset();
    this.boxes.clear();
    this.addBox();
    this.selectedSaladIndexes = [];
    this.submitted = false;
    this.orderSuccess = false;
    this.loading = false;
    this.markAllAsUntouched();
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = tomorrow.toISOString().split('T')[0];
    
    this.boxForm.patchValue({
      orderDate: this.minDate
    });
  }

  openDatePicker(index: number) {
    const dateInput = document.getElementById(`deliveryDate${index}`) as HTMLInputElement;
    if (dateInput) {
      dateInput.showPicker();
    }
  }

  setMinDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
    const day = tomorrow.getDate().toString().padStart(2, '0');
    this.minDate = `${year}-${month}-${day}`;
  }

  getBoxDetails(boxTypeId: string) {
    return this.boxTypes.find(box => box.id === boxTypeId);
  }

  onModalHidden() {
    this.resetForm();
  }
}


