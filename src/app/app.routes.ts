import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { HomeCustomerComponent } from './components/customer/home-customer/home-customer.component';
import { AuthGuard } from './components/guards/auth.guard';
import { HomeAdminComponent } from './components/admin/home-admin/home-admin.component';
import { AdminGuard } from './components/guards/admin.guard';
import { ProductsComponent } from './components/admin/products/products.component';
import { CategoriesComponent } from './components/admin/categories/categories.component';
import { AdminOrdersComponent } from './components/admin/admin-orders/admin-orders.component';
import { CustomerOrdersComponent } from './components/customer/customer-orders/customer-orders.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'customer/home-customer', component: HomeCustomerComponent},
  { path: 'customer/orders', component: CustomerOrdersComponent, canActivate: [AuthGuard] },
  { path: 'admin/products',  component: ProductsComponent, canActivate: [AdminGuard] },
  { path: 'admin/categories',  component: CategoriesComponent, canActivate: [AdminGuard] },
  { path: 'admin/home-admin',  component: HomeAdminComponent, canActivate: [AdminGuard] },
  { path: 'admin/orders', component: AdminOrdersComponent, canActivate: [AdminGuard]},
  { path: '', redirectTo: 'customer/home-customer', pathMatch: 'full' },
  { path: '**', redirectTo: 'customer/home-customer' }
];
