import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ProductCategoryService } from '../product-categories/product-category.service';
import { SupplierService } from '../suppliers/supplier.service';
import { Product } from './product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private productsUrl = 'api/products';
  private suppliersUrl = this.supplierService.suppliersUrl;

  products$ = this.http.get<Product[]>(this.productsUrl).pipe(
    // tap((data) => console.log('Products: ', JSON.stringify(data))),
    tap((data) => console.log('Products: <HTTP Request>')),
    catchError(this.handleError)
  );

  /**
   * combineLatest because it will emit any time any of the streams emits
   */
  productsWithCategory$ = combineLatest([
    this.products$,
    this.productCategoryService.productCategories$,
  ]).pipe(
    map(([products, categories]) =>
      products.map(
        (product) =>
          ({
            ...product,
            price: product.price,
            category: categories.find((c) => product.categoryId === c.id).name,
            searchKey: [product.productName],
          } as Product)
      )
    )
  );

  private productSelectedSubject = new BehaviorSubject<number>(0);
  productSelectedAction$ = this.productSelectedSubject.asObservable();

  selectedProduct$ = combineLatest([
    this.productSelectedAction$,
    this.productsWithCategory$,
  ]).pipe(
    map(([selectedProductId, products]) =>
      products.find((product) => product.id === selectedProductId)
    )
  );

  constructor(
    private http: HttpClient,
    private supplierService: SupplierService,
    private productCategoryService: ProductCategoryService
  ) {}

  selectedProductChanged(productId: number): void {
    this.productSelectedSubject.next(productId);
  }

  private handleError(err: any): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage: string;
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Backend returned code ${err.status}: ${err.body.error}`;
    }
    console.error(err);
    return throwError(errorMessage);
  }
}
