import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { ProfileEntity } from 'src/database/entities/Profile.entity';
import { UserEntity } from 'src/database/entities/User.entity';
import { DataSource, Repository } from 'typeorm';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  private userRepo: Repository<UserEntity>;
  private profileRepo: Repository<ProfileEntity>;

  constructor(
    private cls: ClsService,
    @InjectDataSource() private dataSource: DataSource
  ) {
    this.userRepo = this.dataSource.getRepository(UserEntity);
    this.profileRepo = this.dataSource.getRepository(ProfileEntity);
  }

  getUser(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }

  async getPublicProfile(userId?: number) {
    userId = userId || this.cls.get<UserEntity>('user')?.id;

    let user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['profile', 'profile.image'],
    });
    if (!user) throw new NotFoundException('User is not found');

    return {
      ...user,
      password: undefined,
      email: undefined,
      phone: undefined,
    };
  }

  async updateProfile(params: UpdateProfileDto) {
    let user = this.cls.get<UserEntity>('user');

    if (typeof params.isPrivate === 'boolean') {
      await this.userRepo.update({ id: user.id }, { isPrivate: params.isPrivate })
      delete params.isPrivate
    }

    if (Object.keys(params).length > 0) {
      await this.profileRepo.update({ userId: user.id }, params);
    }

    return {
      message: 'Profile is updated successfully',
    };
  }
}