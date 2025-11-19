import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../supabase'

export default function StoreScreen({ user }) {
  const [productos, setProductos] = useState([])
  const [perfil, setPerfil] = useState(null)
  const [inventario, setInventario] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      cargarDatos()
    }
  }, [user])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      await Promise.all([obtenerPerfil(), obtenerProductos(), obtenerInventario()])
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const obtenerPerfil = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error al obtener perfil:', error)
      } else {
        setPerfil(data)
      }
    } catch (error) {
      console.error('Error inesperado:', error)
    }
  }

  const obtenerProductos = async () => {
    try {
      const { data, error } = await supabase.from('tienda').select('*')
      if (error) {
        console.error('Error al obtener productos:', error)
      } else {
        setProductos(data || [])
      }
    } catch (error) {
      console.error('Error inesperado:', error)
    }
  }

  const obtenerInventario = async () => {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select('producto_id')
        .eq('usuario_id', user.id)

      if (error) {
        console.error('Error al obtener inventario:', error)
      } else {
        // Guardar solo los IDs de productos comprados
        const productosComprados = data?.map(item => item.producto_id) || []
        setInventario(productosComprados)
      }
    } catch (error) {
      console.error('Error inesperado al obtener inventario:', error)
    }
  }

  const estaComprado = (productoId) => {
    return inventario.includes(productoId)
  }

  const comprar = async (item) => {
    if (!perfil) return

    // Verificar si ya está comprado
    if (estaComprado(item.id)) {
      Alert.alert('Ya comprado', 'Ya tienes este producto en tu inventario')
      return
    }

    // Verificar si tiene coins suficientes
    if (perfil.coins < item.precio) {
      Alert.alert('Sin coins suficientes', 'No tienes suficientes coins para comprar este producto 🪙')
      return
    }

    const nuevaCantidad = perfil.coins - item.precio

    try {
      // Iniciar transacción: actualizar coins y agregar al inventario
      const [updateCoinsResult, addInventarioResult] = await Promise.all([
        supabase
          .from('profiles')
          .update({ coins: nuevaCantidad })
          .eq('id', user.id),
        supabase
          .from('inventario')
          .insert({
            usuario_id: user.id,
            producto_id: item.id,
          })
      ])

      if (updateCoinsResult.error) {
        Alert.alert('Error', `Error al actualizar coins: ${updateCoinsResult.error.message}`)
        return
      }

      if (addInventarioResult.error) {
        // Si falla al agregar al inventario, revertir la compra de coins
        await supabase
          .from('profiles')
          .update({ coins: perfil.coins })
          .eq('id', user.id)
        
        // Verificar si es un error de constraint (producto ya existe)
        if (addInventarioResult.error.code === '23505') {
          // Recargar inventario para sincronizar
          await obtenerInventario()
          Alert.alert('Ya comprado', 'Este producto ya está en tu inventario')
        } else {
          Alert.alert('Error', `Error al agregar al inventario: ${addInventarioResult.error.message}`)
        }
        return
      }

      // Actualizar el estado local y recargar datos desde la base de datos
      setInventario([...inventario, item.id])
      // Recargar el perfil desde la base de datos para asegurar sincronización
      await obtenerPerfil()
      Alert.alert('Compra exitosa', `Compraste ${item.nombre}`)
    } catch (error) {
      console.error('Error al comprar:', error)
      Alert.alert('Error', 'Ocurrió un error al procesar la compra')
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando tienda...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Tienda de Avatar</Text>
      {perfil && (
        <Text style={styles.saldo}>Coins: {perfil.coins || 0} 🪙</Text>
      )}

      {productos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay productos disponibles</Text>
        </View>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const comprado = estaComprado(item.id)
            const puedeComprar = perfil && perfil.coins >= item.precio && !comprado

            return (
              <View style={[styles.card, comprado && styles.cardComprado]}>
                <Text style={styles.nombre}>{item.nombre}</Text>
                {item.calidad && <Text>Calidad: {item.calidad}</Text>}
                {item.categoria && <Text>Categoría: {item.categoria}</Text>}
                <Text>Precio: {item.precio} coins</Text>
                
                {comprado && (
                  <View style={styles.badgeComprado}>
                    <Text style={styles.textoBadge}>✓ Ya comprado</Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={[
                    styles.boton, 
                    !puedeComprar && styles.botonDisabled,
                    comprado && styles.botonComprado
                  ]} 
                  onPress={() => comprar(item)}
                  disabled={!puedeComprar}
                >
                  <Text style={styles.textoBoton}>
                    {comprado 
                      ? 'Ya comprado' 
                      : !perfil || perfil.coins < item.precio 
                        ? 'Sin coins suficientes' 
                        : 'Comprar'}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8', padding: 20 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  saldo: { fontSize: 16, marginBottom: 15, fontWeight: '600' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardComprado: {
    backgroundColor: '#f0f8f0',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  nombre: { fontWeight: 'bold', fontSize: 18, marginBottom: 5 },
  badgeComprado: {
    backgroundColor: '#4CAF50',
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  textoBadge: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  boton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  botonDisabled: {
    backgroundColor: '#ccc',
  },
  botonComprado: {
    backgroundColor: '#9E9E9E',
  },
  textoBoton: { color: 'white', fontWeight: 'bold' },
})