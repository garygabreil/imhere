import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Firestore, addDoc, collection } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  boxForm: FormGroup;
  isSubmitting = false;
  submitted = false;
  orderSuccess = false;
  minDate: string = '';
  loading = false; // Loading flag

  selectedSaladIndexes: number[] = []; // Track which boxes are Salad

  constructor(private fb: FormBuilder, private firestore: Firestore) {
    this.setMinDate();

    let originalDate = new Date();
    let newDate = new Date(originalDate);
    let orderDate = newDate.setDate(newDate.getDate() + 1);

    this.boxForm = this.fb.group({
      name: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      address: ['', Validators.required],
      boxes: this.fb.array([this.createBoxGroup()]),
      orderDate: [orderDate],
    });
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
    });
  }

  addBox(): void {
    this.boxes.push(this.createBoxGroup());
  }

  removeBox(index: number): void {
    this.boxes.removeAt(index);
  }

  onBoxTypeChange(event: any, index: number) {
    const selectedValue = event.target.value;
    console.log(selectedValue);
    if (selectedValue === 'salad') {
      if (!this.selectedSaladIndexes.includes(index)) {
        this.selectedSaladIndexes.push(index);
      }
    } else {
      this.selectedSaladIndexes = this.selectedSaladIndexes.filter(
        (i) => i !== index
      );
    }
  }

  order() {
    this.submitted = true;
    this.loading = true; // Show loader

    setTimeout(async () => {
      try {
        const usersRef = collection(this.firestore, 'orderDetails');
        await addDoc(usersRef, this.boxForm.value);

        this.orderSuccess = true; // Show success message
        this.boxForm.reset(); // Reset form

        // Hide success message after 3 seconds
        setTimeout(() => {
          this.orderSuccess = false;
        }, 3000);
      } catch (error) {
        console.error('Error adding document:', error);
        alert('There was an error submitting the form');
      } finally {
        this.loading = false; // Hide loader after submission
        this.submitted = false;
      }
    }, 1000); // 1-second
  }

  openDatePicker(index: number) {
    const dateInput = document.getElementById(
      `deliveryDate${index}`
    ) as HTMLInputElement;
    if (dateInput) {
      dateInput.showPicker(); // Opens the date picker
    }
  }
  setMinDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Set date to tomorrow
    this.minDate = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }
}
