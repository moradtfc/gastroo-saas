"use client"

import { useState, useEffect } from "react"
import { CheckedState } from "@radix-ui/react-checkbox"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { DatabaseService, Country, Group, FoodCategory } from "@/lib/database"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CreateSupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateSupplierModal({ isOpen, onClose, onSuccess }: CreateSupplierModalProps) {
  const [countries, setCountries] = useState<Country[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [foodCategories, setFoodCategories] = useState<FoodCategory[]>([])
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState("")
  const [selectedAddressCountry, setSelectedAddressCountry] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [selectedFoodCategoryId, setSelectedFoodCategoryId] = useState("")
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phonePrefix: "",
    phoneNumber: "",
    hasWhatsApp: false,
    address: "",
    addressLine2: "",
    city: "",
    province: "",
    postalCode: "",
    category: "",
    company: "",
    identifier: "",
    taxId: "",
  })

  useEffect(() => {
    if (isOpen) {
      loadCountries()
      loadGroups()
      loadFoodCategories()
    }
  }, [isOpen])

  const loadCountries = async () => {
    try {
      const data = await DatabaseService.getCountries()
      setCountries(data || [])
    } catch (error) {
      console.error('Error loading countries:', error)
      toast.error('Error al cargar países')
    }
  }

  const loadGroups = async () => {
    try {
      const data = await DatabaseService.getGroups()
      setGroups(data || [])
    } catch (error) {
      console.error('Error loading groups:', error)
      toast.error('Error al cargar grupos')
    }
  }

  const loadFoodCategories = async () => {
    try {
      const data = await DatabaseService.getFoodCategories()
      setFoodCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Error al cargar categorías')
    }
  }

  const handleCountryChange = (countryCode: string, type: 'phone' | 'address') => {
    const country = countries.find(c => c.iso_code === countryCode)
    if (country) {
      if (type === 'phone') {
        setSelectedPhoneCountry(countryCode)
        setFormData(prev => ({ ...prev, phonePrefix: country.phone_prefix }))
      } else {
        setSelectedAddressCountry(countryCode)
      }
    }
  }

  const handleGroupSelectionChange = (groupId: string, checked: CheckedState) => {
    setSelectedGroupIds((prev) => {
      if (checked === true) {
        if (prev.includes(groupId)) {
          return prev
        }
        return [...prev, groupId]
      }
      return prev.filter((id) => id !== groupId)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.firstName) {
        toast.error('Por favor ingresa al menos el nombre')
        return
      }

      // Build full name
      const fullName = formData.lastName 
        ? `${formData.firstName} ${formData.lastName}` 
        : formData.firstName

      // Build full phone
      const phone = formData.phonePrefix && formData.phoneNumber
        ? `${formData.phonePrefix} ${formData.phoneNumber}`
        : ""

      // Build address
      let address = formData.address
      if (formData.addressLine2) {
        address += `, ${formData.addressLine2}`
      }

      const selectedFoodCategory = foodCategories.find((category) => category.id === selectedFoodCategoryId)
      const normalizedBirthDate = birthDate ? format(birthDate, "yyyy-MM-dd") : null

      const supplierData = {
        name: fullName,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email || null,
        phone: phone || null,
        phone_country_code: formData.phonePrefix || null,
        phone_number: formData.phoneNumber || null,
        has_whatsapp: formData.hasWhatsApp,
        address: address || null,
        address_line2: formData.addressLine2 || null,
        country: selectedAddressCountry || null,
        city: formData.city || null,
        province: formData.province || null,
        postal_code: formData.postalCode || null,
        category: selectedFoodCategory?.name || null,
        company: formData.company || null,
        tax_id: formData.taxId || null,
        birth_date: normalizedBirthDate,
        contact_person: formData.firstName || null,
        notes: formData.identifier || null,
        food_category_id: selectedFoodCategoryId || null,
      }

      const newSupplier = await DatabaseService.createSupplier(supplierData)

      if (selectedGroupIds.length > 0) {
        await Promise.all(
          selectedGroupIds.map((groupId) =>
            DatabaseService.addSuppliersToGroup(groupId, [newSupplier.id])
          )
        )
      }

      toast.success('Proveedor creado exitosamente')
      onSuccess()
      handleClose()
    } catch (error: any) {
      console.error('Error creating supplier:', error)
      toast.error(error.message || 'Error al crear proveedor')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phonePrefix: "",
      phoneNumber: "",
      hasWhatsApp: false,
      address: "",
      addressLine2: "",
      city: "",
      province: "",
      postalCode: "",
      category: "",
      company: "",
      identifier: "",
      taxId: "",
    })
    setSelectedPhoneCountry("")
    setSelectedAddressCountry("")
    setSelectedGroupIds([])
    setSelectedFoodCategoryId("")
    setBirthDate(undefined)
    setIsCalendarOpen(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[500px] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-gray-900">Crear proveedor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5 overflow-y-auto flex-1">
          {/* Nombre y Apellidos */}
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-900">
              Nombre
            </label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Nombre"
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600 focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-900">
              Apellidos
            </label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Apellidos"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600 focus:ring-0"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-900">
              Dirección de correo electrónico
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Dirección de correo electrónico"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600 focus:ring-0"
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Número de teléfono
            </label>
            <div className="flex gap-2">
              <Select value={selectedPhoneCountry} onValueChange={(value) => handleCountryChange(value, 'phone')}>
                <SelectTrigger className="w-[100px] px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600">
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.iso_code} value={country.iso_code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="phonePrefix"
                value={formData.phonePrefix}
                onChange={(e) => setFormData(prev => ({ ...prev, phonePrefix: e.target.value }))}
                placeholder="+00"
                className="w-[90px] px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600 focus:ring-0"
              />
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="000 00 00 00"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600 focus:ring-0"
              />
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Switch
                id="whatsapp"
                checked={formData.hasWhatsApp}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasWhatsApp: checked }))}
                className="data-[state=checked]:bg-blue-600"
              />
              <label htmlFor="whatsapp" className="text-sm text-gray-900 cursor-pointer">
                Tiene WhatsApp
              </label>
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Dirección
            </label>
            <Select value={selectedAddressCountry} onValueChange={(value) => handleCountryChange(value, 'address')}>
              <SelectTrigger className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600">
                <SelectValue placeholder="España" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.iso_code} value={country.iso_code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Dirección"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600 focus:ring-0"
            />
          </div>

          <div>
            <Input
              id="addressLine2"
              value={formData.addressLine2}
              onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
              placeholder="Dirección (Línea 2)"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600 focus:ring-0"
            />
          </div>

          <div>
            <Input
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
              placeholder="Código postal"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600 focus:ring-0"
            />
          </div>

          <div>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Ciudad"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600 focus:ring-0"
            />
          </div>

          <div>
            <Input
              id="province"
              value={formData.province}
              onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
              placeholder="Provincia"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600 focus:ring-0"
            />
          </div>

          {/* Grupos */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Grupos
            </label>
            <ScrollArea className="h-40 border border-gray-200 rounded-lg">
              {groups.length === 0 ? (
                <div className="py-4 text-center text-sm text-gray-500">
                  No hay grupos disponibles.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {groups.map((group) => {
                    const isSelected = selectedGroupIds.includes(group.id)
                    const checkboxId = `group-${group.id}`
                    return (
                      <li key={group.id} className={cn("px-4 py-3", isSelected && "bg-blue-50")}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={checkboxId}
                              checked={isSelected}
                              onCheckedChange={(checked) => handleGroupSelectionChange(group.id, checked)}
                              className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <label
                              htmlFor={checkboxId}
                              className="text-sm text-gray-900 cursor-pointer"
                            >
                              {group.name}
                            </label>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              <ScrollBar orientation="vertical" />
            </ScrollArea>
            {selectedGroupIds.length > 0 && (
              <p className="text-xs text-gray-600">
                {selectedGroupIds.length} grupo{selectedGroupIds.length > 1 ? "s" : ""} seleccionado{selectedGroupIds.length > 1 ? "s" : ""}.
              </p>
            )}
          </div>

          {/* Categorías */}
          <div className="space-y-2">
            <label htmlFor="supplierCategory" className="block text-sm font-medium text-gray-900">
              Categoría
            </label>
            <Select
              value={selectedFoodCategoryId}
              onValueChange={(value) => {
                setSelectedFoodCategoryId(value)
                const category = foodCategories.find((item) => item.id === value)
                setFormData(prev => ({ ...prev, category: category?.name || "" }))
              }}
            >
              <SelectTrigger className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {foodCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon ? `${category.icon} ${category.name}` : category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Empresa e Identificador */}
          <div className="space-y-2">
            <label htmlFor="company" className="block text-sm font-medium text-gray-900">
              Empresa
            </label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Empresa"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600 focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-900">
              Identificador de referencia
            </label>
            <Input
              id="identifier"
              value={formData.identifier}
              onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
              placeholder="Identificador de referencia"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600 focus:ring-0"
            />
          </div>

          {/* Fecha de Nacimiento */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Fecha de nacimiento
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCalendarOpen(true)}
                  className={cn(
                    "w-full justify-start text-left font-normal px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600 focus:ring-0",
                    !birthDate && "text-gray-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                  {birthDate ? format(birthDate, "dd/MM/yyyy") : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[9999]" align="start" sideOffset={8}>
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={(date) => {
                    setBirthDate(date)
                    setIsCalendarOpen(false)
                  }}
                  captionLayout="dropdown-buttons"
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Número de IVA */}
          <div className="space-y-2">
            <label htmlFor="taxId" className="block text-sm font-medium text-gray-900">
              Número de IVA
            </label>
            <Input
              id="taxId"
              value={formData.taxId}
              onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
              placeholder="Número de IVA"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-blue-600 focus:ring-0"
            />
          </div>
        </form>

        <DialogFooter className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            className="px-5 py-2.5 text-sm font-semibold text-blue-600 hover:bg-gray-100 rounded"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded"
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

